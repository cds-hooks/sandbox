var isArray = require('util').isArray
var getIn = require('./utils').getIn
var paramsToJson = require('./utils').paramsToJson
var context = require('./context')
var fs = require('fs')

var harvoniTemplate = fs.readFileSync(__dirname + '/static/harvoni.html', 'utf8')

function fillTemplate(template, context) {
  Object.keys(context).forEach(function(k){
    template = template.replace(RegExp("{{\s*" + k + "\s*}}", "g"), context[k])
  })
  return template;
}


module.exports ={
  service: function(indata, cb) {
    cb(null, recommend(indata));
  }, view:  view
}

var callSchema = {
  launch: 1,
  intent: 1,
  content: [],
  redirect: 1,
  "pre-fetch-data": 0
};



var _db = {};
// recommending means returning a set of "card"s, each with a summary, set of suggestions and a set of links.
// recommending can, alternatively, return a single "decision" indicating a user-approved choice.
function view(reason, sid, req, res, next){
  var inData = _db[sid].inData;
  var med = inData.content[0];
  var patient = inData["pre-fetch-data"].entry.filter(function(e){
    return e.resource.resourceType === "Patient"
  })[0].resource;


  var context = {
    "Patient.name": patient.name[0].given.join(" ") + " " + patient.name[0].family.join(" "),
    "Patient.birthDate": patient.birthDate,
    "redirect": _db[sid].redirect
  }

  _db[sid].started = true

  var ret = fillTemplate(harvoniTemplate, context)

  res.setHeader('Content-Type', 'text/html');
  res.writeHead(200);
  res.end(ret);
  next();
}

function assessJNC(inData, cards) {
  inData = paramsToJson(inData, callSchema);
  var med = inData.content[0];
  var launch = inData.launch;
  var redirect = inData.redirect;
  if (!med.reasonCodeableConcept) return;
  var reason = med.reasonCodeableConcept.text;

  if (!reason.match(/hypertension|blood pressure|HTN/i)){
    return 
  }

  _db[launch] = _db[launch] || {}
  _db[launch].redirect = redirect
  _db[launch].inData = inData

  if (!_db[launch].started){
    cards.parameter.push( {
      "name": "card",
      "part": [{
        "name": "summary",
        "valueString": "JNC 8 guidelines may aply",
      },{
        "name": "source",
        "valueString": "Joint National Committee",
      },{
        "name": "indicator",
        "valueString": "info",
      }, {
        "name": "link",
        "part": [{
          "name": "label",
          "valueString": "Tailor therapy with JNC Pro"
        }, {
          "name": "url",
          "valueString": context.url + "/service/pediatric-dose-check/jnc8/" + launch
        }]
      }]
    })
  }
}




function assessHarvoni(inData, cards) {
  inData = paramsToJson(inData, callSchema);
  var med = inData.content[0];
  var launch = inData.launch;
  var redirect = inData.redirect;
  if (! med.medicationCodeableConcept) return;
  var drugName = med.medicationCodeableConcept.text;
  if (!drugName.match(/harvoni|ledipasvir/i)){
    return 
  }

  _db[launch] = _db[launch] || {}
  _db[launch].redirect = redirect
  _db[launch].inData = inData
  if (_db[launch].started){
    cards.parameter.push( {
      "name": "card",
      "part": [{
        "name": "summary",
        "valueString": "Prior authorization in process",
      },{
        "name": "source",
        "valueString": "CareMore PBM",
      },{
        "name": "indicator",
        "valueString": "success",
      }, {
        "name": "link",
        "part": [{
          "name": "label",
          "valueString": "View status"
        }, {
          "name": "url",
          "valueUri": context.url + "/service/pediatric-dose-check/harvoni/" + launch
        }]
      }]
    })
  } else {



    cards.parameter.push({
      "name": "card",
      "part": [{
        "name": "summary",
        "valueString": "Harvoni require prior authorization",
      }, {
        "name": "source",
        "valueString": "CareMore PBM",
      },{
        "name": "indicator",
        "valueString": "warning",
      },{
         "name": "link",
        "part": [{
          "name": "label",
          "valueString": "Begin prior auth process"
        }, {
          "name": "url",
          "valueUri": context.url + "/service/pediatric-dose-check/harvoni/" + launch
        }]
      }]
    });

  }

}

function assessDones() {
  return {
    "name": "card",
    "part": [{
      "name": "summary",
      "valueString": "Dose is high (>99.9th percentile)",
    }, {
      "name": "suggestion",
      "part": [{
        "name": "label",
        "valueString": "5 mg daily"
      }, {
        "name": "alternative",
        "resource": lowerDose
      }]
    }, {
      "name": "suggestion",
      "part": [{
        "name": "label",
        "valueString": "10 mg daily"
      }, {
        "name": "alternative",
        "resource": lowerDose
      }]
    }, {
      "name": "link",
      "part": [{
        "name": "label",
        "valueString": "View prescribing trends"
      }, {
        "name": "url",
        "valueUri": "https://www.cms.gov/Newsroom/MediaReleaseDatabase/Fact-sheets/2015-Fact-sheets-items/2015-04-30.html"
      }]
    }]
  }

}
function recommend(data) {
  var lowerDose = getIn(data, 'content')[0]["resource"];
  if (!lowerDose.medicationCodeableConcept){
    return {}
  }

  var ret = {
    "resourceType": "Parameters",
    "parameter": [
    ]
  }
  assessHarvoni(data, ret)
  assessJNC(data, ret)
  return ret;
}

