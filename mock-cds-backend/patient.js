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
  description: {
    id: "patient-hello-world",
    name: "Patient hello world",
    description: "Greet patient by name",
    hook:{
      "system": "http://cds-hooks.smarthealthit.org/activity",
      "code": "patient-view"
    },
    preFetch: ["Patient/{{Patient.id}}"]
  }
}


function recommend(data) {
  var patient = getIn(data, 'preFetchData')[0].resource.entry[0].resource;
  var name = patient.name[0].given[0];
  return {
    cards: [{
      summary: "Hello " + name + "!",
      source: {
        label: "Patient greeting service"
      },
      indicator: "success"
    }]
  }
}

