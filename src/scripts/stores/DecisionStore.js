import axios from 'axios'
import ActionTypes from '../actions/ActionTypes'
import defaultHooks from './HookStore.defaults'
import MedicationPrescribeStore from './MedicationPrescribeStore'
import PatientViewStore from './PatientViewStore'
import FhirServerStore from './FhirServerStore'
import HookStore from './HookStore'
import moment from 'moment'
import uuid from 'node-uuid'
import { getIn, paramsToJson } from '../../../mock-cds-backend/utils.js'

var AppDispatcher = require('../dispatcher/AppDispatcher')
var EventEmitter = require('events').EventEmitter
var assign = require('object-assign')
var Immutable = require('immutable')
var DELAY = 0; // no delay to apply hooks

HookStore.addChangeListener(_hooksChanged)
FhirServerStore.addChangeListener(_hooksChanged)

var CHANGE_EVENT = 'change'
var state = Immutable.fromJS({
  calling: false,
  cards: []
})

var preFetchData = Promise.resolve({})
function getFhirContext() {
  var c = FhirServerStore.getState().get('context');
  return c.set('Patient.id', c.get('patient')).toJS()
}

function fillTemplate(template, context) {
  var flat = JSON.stringify(template)
  .replace(/{{\s*Patient\.id\s*}}/g, context["Patient.id"])
  return JSON.parse(flat)
}
function _externalAppReturned() {
  console.log("Handling external return by re-running hooks")
  callHooks(state)
}

function _hooksChanged() {
  var context = getFhirContext()
  console.log("Eval hooks changed in context", context)
  var hooks = HookStore.getState().get('hooks').filter((v,k) => 
    HookStore.getState().getIn(['hooks', k, 'enabled'])
  )

  var hookNames = hooks.keySeq()
  console.log("HN", hookNames.count());

  state = state.set('cards', Immutable.fromJS([]));
  state = state.set('hooks', hooks)

  var hooksToFetch = hooks.valueSeq().filter(h => h.get('preFetchTemplate'));

  var hookFetches = hooksToFetch
  .map(h => axios({
    url: context.baseUrl,
    method: 'post',
    data: fillTemplate(h.get('preFetchTemplate'), context)
  })
      ).toJS()


      state = state.set('preFetchData', Promise.all(hookFetches)
                        .then(preFetchResults => preFetchResults.reduce(
                          (coll, r, i) => coll.set(hooksToFetch.get(i).get('url'), r.data),
                            Immutable.fromJS({}))


                             ))

                             console.log("Pending prefetc")
                             callHooks(state)
}


var _hookUuid = uuid.v4()

var idService = {
  createIds() {
    return {
      hookInstance: _hookUuid
    }
  }
}

var _base = window.location.protocol + "//" + window.location.host + window.location.pathname;
if (!_base.match(/.*\//)) {
  _base += "/";
}

function hookBody(h, fhir, preFetchData) {
  var ids = idService.createIds()
  var ret = {
    hook: {
        "system": "http://cds-hooks.smarthealthit.org/hook",
        "code": state.get('hook')
    },
    hookInstance: ids.hookInstance,
    fhirServer: FhirServerStore.getState().getIn(['context', 'baseUrl']),
    redirect: _base + "service-done.html",
    user: "Practitioner/example",
    patient: FhirServerStore.getState().getIn(['context', 'patient']),
    preFetchData: preFetchData,
    context: []
  }
  if (fhir)
    ret.context.push(fhir);
  return ret;
}

var cardKey = 0
function addCardsFrom(callCount, hookUrl, result) {
  if (!result.data) {
    return;
  }
  if (state.get('callCount') !== callCount) {
    return;
  }

  state = state.set('calling', false)
  var result = result.data
  console.log("3 addCardsFrom", result)
  var decisions = result.decisions
  if (decisions && decisions.length > 0) {
    AppDispatcher.dispatch({
      type: ActionTypes.TAKE_SUGGESTION,
      suggestion: {
        create: decisions[0].create
      }
    })
  }

  var cards = result.cards || []
  console.log("Got cards", cards);
  cards = Immutable.fromJS(cards).map((v, k) => v.set('key', cardKey++)
                                      .set('suggestions', v.get('suggestions', []).map(s => s.set("key", cardKey++)))
                                      .set('links', v.get('links', []).map(s => s.set("key", cardKey++)))
                                     ).toJS()
                                     console.log("Added as", cards)
                                     var newCards = state.get('cards').push(...cards)
                                     state = state.set('cards', newCards)

                                     DecisionStore.emitChange()
}

var callCount = 0;
function callHooks(localState) {
  var myCallCount = callCount++;
  state = state.set('cards', Immutable.fromJS([]));
  state = state.set('callCount', myCallCount)
  state = state.set('calling', true)

  var applicableServices = localState
  .get('hooks')
  .filter((h, hookUrl) => h.get('hook') === localState.get('hook'))

  if (applicableServices.count() == 0) {
    console.log("no applicable services")
    state = state.set('calling', false)
  } else {
    console.log("call applicable services", applicableServices.count())
  }


  localState.get('preFetchData').then((preFetchData) => {

    var results = applicableServices.map((h, hookUrl) => axios({
      url: h.get('url'),
      method: 'post',
      data: hookBody(
        h,
        localState.get('fhir') && localState.get('fhir').toJS(),
        preFetchData.get(h.get('url'))),
        headers: {
          'Content-Type': 'application/json+fhir'
        }
    }))
    .forEach((p, hookUrl) => p.then(result => addCardsFrom(myCallCount, hookUrl, result)))
  })
  DecisionStore.emitChange()
}


var DecisionStore = assign({}, EventEmitter.prototype, {

  getState: function() {
    return state
  },

  setActivity: function(hook) {
    console.log("Set hook", hook)
    state = state.merge(_stores[hook].getState())
    state.get('hookStore').processChange()
    console.log("PC", state.get('hookStore').processChange)
    DecisionStore.emitChange()
  },

  setActivityState: function(hook, resource) {
    if (hook !== state.get('hook')) {
      return;
    }

    if (!Immutable.is(resource, state.get('fhir'))) {
      state = state.set('fhir', resource)
      state = state.set('cards', Immutable.List())
      setTimeout(() => callHooks(state), DELAY)
    }
  },

  getStateToPublish: function() {
    return {
      hook: state.get("hook")
    }
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

DecisionStore.dispatchToken = AppDispatcher.register(function(action) {

  switch (action.type) {

      case ActionTypes.EXTERNAL_APP_RETURNED:
          _externalAppReturned()
          break

      case ActionTypes.LOADED:
          break

      case ActionTypes.SET_ACTIVITY:
          DecisionStore.setActivity(action.hook)
          break

      case ActionTypes.NEW_HASH_STATE:
          var hash = action.hash
          DecisionStore.setActivity(hash.hook || 'medication-prescribe')
          break

      default:
          // do nothing
  }

})

var _stores = {
  'medication-prescribe': MedicationPrescribeStore.register(DecisionStore),
  'patient-view': PatientViewStore.register(DecisionStore)
};
_hooksChanged()

module.exports = DecisionStore
