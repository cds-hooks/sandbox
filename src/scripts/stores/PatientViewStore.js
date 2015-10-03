import ActionTypes from '../actions/ActionTypes'
import DateStore from './DateStore'
import DrugStore from './DrugStore'
import HookStore from './HookStore'
import FhirServerStore from './FhirServerStore'
import moment from 'moment'

var assign = require('object-assign')
var AppDispatcher = require('../dispatcher/AppDispatcher')
var EventEmitter = require('events').EventEmitter
var Immutable = require('immutable')
var DecisionStore = null

FhirServerStore.addChangeListener(_changed)

function _changed() {
  DecisionStore.setActivityState('patient-view', null)
}

var PatientViewStore = assign({}, EventEmitter.prototype, {
  getState: function() {
    return state
  },

  register(ds){
    DecisionStore = ds
    return this
  },

  processChange: function(){
    _changed()
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

var state = Immutable.fromJS({
  'activity': 'patient-view',
  'fhir': {}
}).set('activityStore', PatientViewStore)

module.exports = PatientViewStore
