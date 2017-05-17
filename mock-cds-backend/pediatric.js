var isArray = require('util').isArray
var metadata = require('./utils').metadata
var context = require('./context')
var fs = require('fs')


var templates = {
  harvoni: fs.readFileSync(__dirname + '/static/harvoni.html', 'utf8'),
  jnc8: fs.readFileSync(__dirname + '/static/jnc8.html', 'utf8')
}

function fillTemplate(template, context) {
  Object.keys(context).forEach(function(k){
    template = template.replace(RegExp("{{\s*" + k + "\s*}}", "g"), context[k])
  })
  return template;
}


module.exports ={
  service: function(indata, cb) {
    cb(null, recommend(indata));
  }, view:  view,
  description: {
    hook: "medication-prescribe",
    name: "Random grab-bag of mock services",
    description: "Generate a bunch of cards for various reasons",
    id: "pediatric-dose-check",
    prefetch:{
      patient: "Patient/{{Patient.id}}"
    }
  }
}

var _db = {};
// recommending means returning a set of "card"s, each with a summary, set of suggestions and a set of links.
// recommending can, alternatively, return a single "decision" indicating a user-approved choice.
function view(reason, sid, req, res, next){
  var inData = _db[sid].inData;
  var med = inData.context[0];
  var patient = inData.prefetch.patient.resource;

  var context = {
    "Patient.name": patient.name[0].given.join(" ") + " " + patient.name[0].family.join(" "),
    "Patient.birthDate": patient.birthDate,
    "redirect": _db[sid].redirect
  }

  _db[sid]["started"+reason] = true

  var ret = fillTemplate(templates[reason], context)

  res.setHeader('Content-Type', 'text/html');
  res.writeHead(200);
  res.end(ret);
  next();
}

function assessJNC(inData, response) {
  var med = inData.context[0];
  var hookInstance = inData.hookInstance;
  var redirect = inData.redirect;
  if (!med.reasonCodeableConcept) return;
  var reason = med.reasonCodeableConcept.text;

  if (!reason.match(/hypertension|blood pressure|HTN/i)){
    return
  }

  _db[hookInstance] = _db[hookInstance] || {}
  _db[hookInstance].redirect = redirect
  _db[hookInstance].inData = inData

  if (!_db[hookInstance]["startedjnc8"]){
    response.cards.push( {
      summary: "JNC 8 guidelines apply",
      source: "Joint National Commission",
      indicator: "info",
      links: [{
        label: "Tailor therapy with JNC Pro",
        url: context.url + "/service/pediatric-dose-check/jnc8/" + hookInstance
      }]
    })
  } else {
    if (!_db[hookInstance].sentJnc8Decision) {
      _db[hookInstance].sentJnc8Decision = true;
      response.decisions.push({
        "delete": "old-id",
        "create": [{
          "resourceType": "MedicationOrder",
          "startDate": "2015-09-17",
          "endDate": "2015-10-17",
          "status": "draft",
          "patient": {
            "reference": "Patient/example"
          },
          "reasonCodeableConcept": med.reasonCodeableConcept,
          "medicationCodeableConcept": {
            "text": "Hydrochlorothiazide 12.5 MG Oral Capsule",
            "coding": [
              {
                "display": "Hydrochlorothiazide 12.5 MG Oral Capsule",
                "system": "http://www.nlm.nih.gov/research/umls/rxnorm",
                "code": "199903"
              }
            ]
          },
          "dosageInstruction": [
            {
              "doseQuantity": {
                "value": 1,
                "system": "http://unitsofmeasure.org",
                "code": "{pill}"
              },
              "timing": {
                "repeat": {
                  "frequency": 1,
                  "period": 1,
                  "periodUnits": "d"
                }
              }
            }
          ]
        }]
      });
      response.cards.push({
        summary: "Managing with JNC Pro",
        source: {
          label: "Joint National Commission"
        },
        indicator: "success",
        links: [{
          label: "Tailor therapy",
          url: context.url + "/service/pediatric-dose-check/jnc8/" + hookInstance
        }]
      });
    }
  }
}




function assessHarvoni(inData, cards) {
  var med = inData.context[0];
  var hookInstance = inData.hookInstance;
  var redirect = inData.redirect;
  if (! med.medicationCodeableConcept) return;
  var drugName = med.medicationCodeableConcept.text;
  if (!drugName.match(/harvoni|ledipasvir/i)){
    return 
  }

  _db[hookInstance] = _db[hookInstance] || {}
  _db[hookInstance].redirect = redirect
  _db[hookInstance].inData = inData
  if (_db[hookInstance].startedharvoni){
    cards.cards.push( {
      summary: "Prior authorization in process",
      source: {
        label: "CareMore PBM",
      },
      indicator: "success",
      links: [{
        label: "View status",
        url: context.url + "/service/pediatric-dose-check/harvoni/" + hookInstance
      }]
    })
  } else {
    cards.cards.push({
      summary: "Harvoni requires prior authorization",
      source: {
        label: "CareMore PBM",
      },
      indicator: "warning",
      links: [{
        label: "Begin prior auth process",
        url: context.url + "/service/pediatric-dose-check/harvoni/" + hookInstance
      }]
    });
  }
}

function assessGenetics(inData, cards) {
  var med = inData.context[0];
  if (! med.medicationCodeableConcept) return;
  var drugName = med.medicationCodeableConcept.text;
  console.log("Check allopurinol");
  if (!drugName.match(/allopurinol/i)){
    return;
  }

  console.log("match allopurinol");

  var summary = 'Allopurinol contraindicated: life-threatening SCAR risk';
  var detail = '\
  ### Patient is `HLA-B*58:01` positive\n\
  \n\
  **Implication**: Significantly increased risk of allopurinol-induced SCAR\n\
  \n\
  **Absolute risk**: ~1.5%\n\
  \n\
  **Recommendations**: Allopurinol is contraindicated\n\
  \n\
  **Classification**:  Strong\n\
  \n\
  **Evidence**:\n\
  <img src="http://www.biomedcentral.com/content/figures/1471-2350-12-118-2-l.jpg" width="500px"/>';

  cards.cards.push({
    summary: summary,
    source: {
      label: "PharmGKB",
    },
    indicator: "danger",
    detail: detail,
    links: [{
      label: "View PharmGKB Guidelines",
      url: "https://www.pharmgkb.org/drug/PA448320#PA166105003"
    }]
  });
}

function recommend(data) {
  var lowerDose = data.context[0]
  var ret = {
    cards: [],
    decisions: []
  }
  assessHarvoni(data, ret)
  assessJNC(data, ret)
  assessGenetics(data, ret)
  return ret;
}
