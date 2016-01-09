var isArray = require('util').isArray
var getIn = require('./utils').getIn
var paramsToJson = require('./utils').paramsToJson
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
  metadata: metadata([
      {
        "url" : "name",
        "valueString" : "Random grab-bag of mock services"
      },
      {
        "url" : "activity",
        "valueCoding" : {
          "code" : "medication-prescribe",
          "display" : "Provide information about a prescription in-progress",
          "system" : "http://cds-hooks.smarthealthit.org/activity"
        }
      },
      {
        "url" : "preFetchOptional",
        "valueString" : "Patient/{{Patient.id}}"
      }
    ])
}

// TODO incorporate types here
var callSchema = {
  activityInstance:[0, "*", "string"],
  activity:  [0, "*", "coding"],
  redirect:  [0, "*", "uri"],
  context:   [0, "*", "resource"],
  preFetchData: [0, 1, "resource"]
};



var _db = {};
// recommending means returning a set of "card"s, each with a summary, set of suggestions and a set of links.
// recommending can, alternatively, return a single "decision" indicating a user-approved choice.
function view(reason, sid, req, res, next){
  var inData = _db[sid].inData;
  var med = inData.context[0];
  var patient = inData.preFetchData.entry.filter(function(e){
    return e.resource.resourceType === "Patient"
  })[0].resource;


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
  inData = paramsToJson(inData, callSchema);
  var med = inData.context[0];
  var activityInstance = inData.activityInstance;
  var redirect = inData.redirect;
  if (!med.reasonCodeableConcept) return;
  var reason = med.reasonCodeableConcept.text;

  if (!reason.match(/hypertension|blood pressure|HTN/i)){
    return 
  }

  _db[activityInstance] = _db[activityInstance] || {}
  _db[activityInstance].redirect = redirect
  _db[activityInstance].inData = inData

  if (!_db[activityInstance]["startedjnc8"]){
    response.parameter.push( {
      "name": "card",
      "part": [{
        "name": "summary",
        "valueString": "JNC 8 guidelines apply",
      },{
        "name": "source",
        "part": [{
          "name": "label",
          "valueString": "Joint National Commission",
        }]
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
          "valueString": context.url + "/service/pediatric-dose-check/jnc8/" + activityInstance
        }]
      }]
    })
  } else {
    if (!_db[activityInstance].sentJnc8Decision) {
      _db[activityInstance].sentJnc8Decision = true;
      response.parameter.push({
        "name": "decision",
        "part": [{
          "name": "delete",
          "valueString": "old-id" // TODO populate with temp id of the thing to replace
        }, {
          "name": "create",
          "resource": {
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
          }
        }]
      })
    }
    response.parameter.push({
      "name": "card",
      "part": [{
        "name": "summary",
        "valueString": "Managing with JNC Pro",
      },{
        "name": "source",
        "part": [{
          "name": "label",
          "valueString": "Joint National Commission",
        }]
      },{
        "name": "indicator",
        "valueString": "success",
      }, {
        "name": "link",
        "part": [{
          "name": "label",
          "valueString": "Tailor therapy"
        }, {
          "name": "url",
          "valueString": context.url + "/service/pediatric-dose-check/jnc8/" + activityInstance
        }]
      }]
    });

  }
}




function assessHarvoni(inData, cards) {
  inData = paramsToJson(inData, callSchema);
  var med = inData.context[0];
  var activityInstance = inData.activityInstance;
  var redirect = inData.redirect;
  if (! med.medicationCodeableConcept) return;
  var drugName = med.medicationCodeableConcept.text;
  if (!drugName.match(/harvoni|ledipasvir/i)){
    return 
  }

  _db[activityInstance] = _db[activityInstance] || {}
  _db[activityInstance].redirect = redirect
  _db[activityInstance].inData = inData
  if (_db[activityInstance].startedharvoni){
    cards.parameter.push( {
      "name": "card",
      "part": [{
        "name": "summary",
        "valueString": "Prior authorization in process",
      },{
        "name": "source",
        "part": [{
          "name": "label",
          "valueString": "CareMore PBM",
        }]
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
          "valueUri": context.url + "/service/pediatric-dose-check/harvoni/" + activityInstance
        }]
      }]
    })
  } else {



    cards.parameter.push({
      "name": "card",
      "part": [{
        "name": "summary",
        "valueString": "Harvoni requires prior authorization",
      },{
        "name": "source",
        "part": [{
          "name": "label",
          "valueString": "CareMore PBM",
        }]
      } ,{
        "name": "indicator",
        "valueString": "warning",
      },{
        "name": "link",
        "part": [{
          "name": "label",
          "valueString": "Begin prior auth process"
        }, {
          "name": "url",
          "valueUri": context.url + "/service/pediatric-dose-check/harvoni/" + activityInstance
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
        "name": "create",
        "resource": lowerDose
      }]
    }, {
      "name": "suggestion",
      "part": [{
        "name": "label",
        "valueString": "10 mg daily"
      }, {
        "name": "create",
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

function assessGenetics(inData, cards) {
  inData = paramsToJson(inData, callSchema);
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

  cards.parameter.push({
    "name": "card",
    "part": [{
      "name": "summary",
      "valueString": summary,
    },{
      "name": "source",
      "part": [{
        "name": "label",
        "valueString": "PharmGKB",
      }]
    },{
      "name": "indicator",
      "valueString": "danger",
    }, {
      "name": "detail",
      "valueString": detail
    },{
      "name": "link",
      "part": [{
        "name": "label",
        "valueString": "View PharmGKB Guidelines"
      }, {
        "name": "url",
        "valueUri": "https://www.pharmgkb.org/drug/PA448320#PA166105003"
      }]
    }]
  });
}


function recommend(data) {
  var lowerDose = getIn(data, 'context')[0]["resource"];
  var ret = {
    "resourceType": "Parameters",
    "parameter": [
    ]
  }
  assessHarvoni(data, ret)
  assessJNC(data, ret)
  assessGenetics(data, ret)
  return ret;
}

