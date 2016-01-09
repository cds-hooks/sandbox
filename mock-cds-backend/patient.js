var isArray = require('util').isArray
var getIn = require('./utils').getIn
var paramsToJson = require('./utils').paramsToJson
var context = require('./context')
var fs = require('fs')
var metadata = require('./utils').metadata

module.exports = {
  service: function(indata, cb) {
    cb(null, recommend(indata));
  },
  view: null,
  metadata: metadata([
    {
      "url" : "name",
      "valueString" : "Display a greeting for a patient"
    },
    {
      "url" : "activity",
      "valueCoding" : {
        "code" : "patient-view",
        "display" : "Provide information about a Patient",
        "system" : "http://cds-hooks.smarthealthit.org/activity"
      }
    },

    {
      "url" : "preFetchRequired",
      "valueString" : "Patient/{{Patient.id}}"
    }

  ])



}


function recommend(data) {
  var patient = getIn(data, 'preFetchData')[0].resource.entry[0].resource;
  var name = patient.name[0].given[0];
  var ret = {
    "resourceType": "Parameters",
    "parameter": [
      {
        "name": "card",
        "part": [{
          "name": "summary",
          "valueString": "Hello " + name + "!"
        }, {
          "name": "source",
          "part": [{
            "name": "label",
            "valueString": "Patient Greeting Service",
          }]
        }, {
          "name": "indicator",
          "valueString": "success",
        }]
      }
    ]
  }
  return ret;
}

