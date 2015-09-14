var isArray = require('util').isArray
var getIn = require('./utils').getIn

module.exports = function(indata, cb) {
  cb(null, recommend(indata));
}

// recommending means returning a set of "card"s, each with a summary, set of suggestions and a set of links.
// recommending can, alternatively, return a single "decision" indicating a user-approved choice.

function recommend(data) {
  var lowerDose = getIn(data, 'content')[0]["resource"];
  if (!lowerDose.medicationCodeableConcept){
    return {}
  }

  var ret = {
    "resourceType": "Parameters",
    "parameter": [
      {
        "name": "card",
        "part": [{
          "name": "summary",
          "valueString": "JNC 8 guidelines may apply",
        }, {
          "name": "link",
          "part": [{
            "name": "label",
            "valueString": "Tailor therapy with JNC Pro"
          }, {
            "name": "url",
            "valueUri": "https://www.cms.gov/Newsroom/MediaReleaseDatabase/Fact-sheets/2015-Fact-sheets-items/2015-04-30.html"
          }]
        }]
      },{
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
    ]
  }
  console.log("Returning", ret)
  return ret;
}

