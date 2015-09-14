import ActionTypes from '../actions/ActionTypes'
import defaultHooks from './HookStore.defaults'
import DateStore from './DateStore'
import DrugStore from './DrugStore'
import HookStore from './HookStore'
import DecisionStore from './DecisionStore'
import moment from 'moment'
import uuid from 'node-uuid'
import FhirServerStore from './FhirServerStore'
import { getIn, paramsToJson } from '../../../mock-cds-backend/utils.js'

var AppDispatcher = require('../dispatcher/AppDispatcher')
var EventEmitter = require('events').EventEmitter
var assign = require('object-assign')
var Immutable = require('immutable')
var CHANGE_EVENT = 'change'
var state = Immutable.fromJS({ })

var preFetchData = Promise.resolve({})
DrugStore.addChangeListener(_changed)
DateStore.addChangeListener(_changed)
HookStore.addChangeListener(_changed)
DecisionStore.addChangeListener(_changed)
FhirServerStore.addChangeListener(_changed)

var AppStore = assign({}, EventEmitter.prototype, {

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

_changed()
function _changed() {
  state = state.merge(Immutable.Map({
    dates: DateStore.getDates(),
    drug: DrugStore.getState(),
    hooks: HookStore.getState(),
    decisions: DecisionStore.getState(),
    fhirServer: FhirServerStore.getState()
  }))
  AppStore.emitChange()
}


module.exports = AppStore
