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

var decisionSchema = {
  'decision': [0, '*', {
    'create': [0, '*', 'resource'],
    'delete': [0, '*', 'id']
  }],
  'card': [0, '*', {
    'summary': [1, 1, 'string'],
    'source': [1, 1, {
      'label': [1, 1, 'string'],
      'url': [0, 1, 'uri']
    }],
    'detail': [0, 1, 'string'],
    'indicator': [1, 1, 'code'],
    'suggestion': [0, '*', {
      'label': [1, 1, 'string'],
      'create': [0, '*', 'resource'],
      'delete': [0, '*', 'id']
    }],
    'link': [0, '*', {
      'label': [1, 1, 'string'],
      'url': [1, 1, 'uri']
    }]
  }]
};

var CHANGE_EVENT = 'change'
var state = Immutable.fromJS({
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
  var hooks = HookStore.getState().get('hooks')
  var hookNames = hooks.keySeq()

  if (Immutable.is(hooks, state.get('hooks'))) {
    return;
  }

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


// 
// ActivityGenerators call:
// DecisionStore.setActivityState({'activity': 'medication-prescribe', 'fhir', {resource})
// which proparges to the DecisionStore state.
// and calls the hooks, filtered on activity match.
var _activityUuid = uuid.v4()

var idService = {
  createIds() {
    return {
      activityInstance: _activityUuid
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
    "resourceType": "Parameters",
    "parameter": [{
      "name": "activity",
      "valueCoding": {
        "system": "http://cds-hooks.smarthealthit.org/activity",
        "code": state.get('activity')
      }
    }, {
      "name": "activityInstance",
      "valueString": ids.activityInstance
    }, {
      "name": "fhirServer",
      "valueUri": FhirServerStore.getState().getIn(['context', 'baseUrl'])
    }, {
      "name": "redirect",
      "valueString": _base + "service-done.html"
    }, {
      "name": "user",
      "valueString": "Practitioner/example"
    }, {
      "name": "patient",
      "valueId": FhirServerStore.getState().getIn(['context', 'patient'])
    }, {
      "name": "preFetchData",
      "resource": preFetchData
    }]
  }
  if (fhir)
    ret.parameter.push({
      "name": "context",
      "resource": fhir
    });
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
  var result = paramsToJson(result.data, decisionSchema)
  var decision = result.decision
  if (decision && decision.length > 0) {
    AppDispatcher.dispatch({
      type: ActionTypes.TAKE_SUGGESTION,
      suggestion: {
        create: decision[0].create
      }
    })
  }

  var cards = result.card || []
  cards = Immutable.fromJS(cards).map((v, k) => v.set('key', cardKey++)
      .set('suggestion', v.get('suggestion').map(s => s.set("key", cardKey++)))
      .set('link', v.get('link').map(s => s.set("key", cardKey++)))
  ).toJS()
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
    .filter((h, hookUrl) => h.get('activity') === localState.get('activity'))

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
          preFetchData.get(h.get('url')))
      }))
      .forEach((p, hookUrl) => p.then(result => addCardsFrom(myCallCount, hookUrl, result)))
  })
  DecisionStore.emitChange()
}


var DecisionStore = assign({}, EventEmitter.prototype, {

  getState: function() {
    return state
  },

  setActivity: function(activity) {
    console.log("Set activity", activity)
    state = state.merge(_stores[activity].getState())
    state.get('activityStore').processChange()
    console.log("PC", state.get('activityStore').processChange)
    DecisionStore.emitChange()
  },

  setActivityState: function(activity, resource) {
    if (activity !== state.get('activity')) {
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
      activity: state.get("activity")
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
      DecisionStore.setActivity(action.activity)
      break

    case ActionTypes.NEW_HASH_STATE:
      var hash = action.hash
      DecisionStore.setActivity(hash.activity || 'medication-prescribe')
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
