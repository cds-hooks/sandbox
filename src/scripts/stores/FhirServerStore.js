import axios from 'axios'
import ActionTypes from '../actions/ActionTypes'
import moment from 'moment'
import uuid from 'node-uuid'
import { getIn, paramsToJson } from '../../../mock-cds-backend/utils.js'

var AppDispatcher = require('../dispatcher/AppDispatcher')
var EventEmitter = require('events').EventEmitter
var assign = require('object-assign')
var Immutable = require('immutable')

var CHANGE_EVENT = 'change'

var defer = function() {
  var ret = {};
  ret.promise = new Promise(function(resolve, reject) {
    ret.resolve = resolve;
    ret.reject = reject;
  })
  return ret;
}
var adapter = {
  defer: defer,
  http: axios
}
var fhir = require('../../../vendor/fhir')
var fhirClient = function(config) {
  return fhir(config, adapter)
}

var _client;


function _fetchData() {
  console.log("Will get stat efor ",  state.getIn(['context', 'patient']))
  _client.search({
    type: 'Condition',
    query: {
      patient: state.getIn(['context', 'patient'])
    }
  }).then(b => {
      var original = state;
      state = state.set('conditions', b.data.entry)
      if (!Immutable.is(original, state)) {
        FhirServiceStore.emitChange()
      }
    }).catch(e => {
      console.log("Error fetching conditions", e)
  })
}


var state = Immutable.fromJS({
  "context": {
    mock: true,
    conditions: []
  },
  "condition": [],
  "selection": null
})


var FhirServiceStore = assign({}, EventEmitter.prototype, {
  setContext: function(fhirContext) {
    state = state.set('context', Immutable.fromJS(fhirContext))
    _client = fhirClient(fhirContext)
    _fetchData()
  },
  getState: function() {
    return state
  },

  emitChange: function() {
    this.emit(CHANGE_EVENT)
  },

  /**
   * @param {function} callback
   */
  addChangeListener: function(callback) {
    this.on(CHANGE_EVENT, callback)
  },

  /**
   * @param {function} callback
   */
  removeChangeListener: function(callback) {
    this.removeListener(CHANGE_EVENT, callback)
  }

})

FhirServiceStore.dispatchToken = AppDispatcher.register(function(action) {

  switch (action.type) {
    case ActionTypes.PICK_CONDITION:
      var match = state.get('conditions').map(c=>c.resource.code).filter(c=> c.coding[0].code === action.selection)
      state= state.set('selection', action.selection)
      state= state.set('selectionAsFhir', match[0] )
      FhirServiceStore.emitChange()
      break

    default:
  }

})

import querystring from 'querystring'
var qs = querystring.parse(window.location.search.slice(1))
var fhirContext = {
  patient: qs.patientId,
  baseUrl: qs.fhirServiceUrl
}

FhirServiceStore.setContext(fhirContext)

module.exports = FhirServiceStore
