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
    hook: "patient-view",
    prefetch: {
      patientToGreet: "Patient/{{Patient.id}}"
    }
  }
}

function recommend(data) {
  var patient = data.prefetch.patientToGreet.resource;
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

