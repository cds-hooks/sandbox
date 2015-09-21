import axios from 'axios'
import ActionTypes from '../actions/ActionTypes'
import defaultHooks from './HookStore.defaults'
import FhirServerStore from './FhirServerStore'
import DateStore from './DateStore'
import DrugStore from './DrugStore'
import HookStore from './HookStore'
import moment from 'moment'
import uuid from 'node-uuid'
import { getIn, paramsToJson } from '../../../mock-cds-backend/utils.js'

var AppDispatcher = require('../dispatcher/AppDispatcher')
var EventEmitter = require('events').EventEmitter
var assign = require('object-assign')
var Immutable = require('immutable')
var DELAY = 0; // no delay to apply hooks

var decisionSchema = {
  'decision': [0, '*', {
    'create': [0, '*', 'resource'],
    'delete': [0, '*', 'string']
  }],
  'card': [0, '*', {
    'summary': [1, 1, 'string'],
    'detail': [0, 1, 'string'],
    'source': [1, 1, 'string'],
    'indicator': [1, 1, 'string'],
    'suggestion': [0, '*', {
      'label': [1, 1, 'string'],
      'create': [0, '*', 'resource'],
      'delete': [0, '*', 'string']
    }],
    'link': [0, '*', {
      'label': 1,
      'url': 1
    }]
  }]
};

var CHANGE_EVENT = 'change'
var state = Immutable.fromJS({
  fhir: {},
  additions: [],
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
        Immutable.fromJS({}))))

  callHooks(state)
}

function _rxChanged() {
  var props = {
    dates: DateStore.getDates(),
    server: FhirServerStore.getState(),
    drug: DrugStore.getState()
  }
  var resource = toFhir(props)
  if (!Immutable.is(resource, state.get('fhir'))) {
    state = state.set('fhir', resource)
    state = state.set('cards', Immutable.List())
    DecisionStore.emitChange()
    console.log("X CHANGE", resource.toJS())
    setTimeout(() => callHooks(state), DELAY)
  }
}

var _sessionUuid = "25d2efb8-5499-48bf-9428-da8ed247ed00"
var _activityUuid = uuid.v4()

var idService = {
  createIds() {
    return {
      sessionId: _sessionUuid,
      activityId: _activityUuid
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
      "name": "sessionId",
      "valueString": ids.sessionId
    }, {
      "name": "activityId",
      "valueString": ids.activityId
    }, {
      "name": "redirect",
      "valueString": _base + "service-done.html"
    }, {
      "name": "activity",
      "valueString": "medication-prescribe"
    }, {
      "name": "context",
      "resource": fhir
    }, {
      "name": "preFetchData",
      "resource": preFetchData
    }]
  }
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
  localState.get('preFetchData').then((preFetchData) => {
    var results = localState.get('hooks').map((h, hookUrl) => axios({
        url: h.get('url'),
        method: 'post',
        data: hookBody(h, localState.get('fhir').toJS(), preFetchData.get(h.get('url')))
      }))
      .forEach((p, hookUrl) => p.then(result => addCardsFrom(myCallCount, hookUrl, result)))
  })
  DecisionStore.emitChange()
}

function toFhir(props) {
  var resource = {
    "resourceType": "MedicationOrder"
  }
  console.log("tofhir", props)
  if (props.dates.start && props.dates.start.enabled)
    resource.startDate = moment(props.dates.start.value).format("YYYY-MM-DD")
  if (props.dates.end && props.dates.end.enabled)
    resource.endDate = moment(props.dates.end.value).format("YYYY-MM-DD")
  resource.status = "draft"
  resource.patient = {
    "reference": "Patient/example"
  }
  if (props.drug && props.drug.get('step') === "done") {
    var med = props.drug.getIn(['decisions', 'prescribable']).toJS();
    resource.medicationCodeableConcept = {
      "text": med.str,
      "coding": [{
        "display": med.str,
        "system": "http://www.nlm.nih.gov/research/umls/rxnorm",
        "code": med.cui
      }]
    }
  }

  var freqs = {
    'daily': 1,
    'bid': 2,
    'tid': 3,
    'qid': 4
  }

  if (props.drug.get('sig')) {
    var sig = props.drug.get('sig').toJS();
    resource.dosageInstruction = [{
      doseQuantity: {
        value: sig.number,
        system: "http://unitsofmeasure.org",
        code: "{pill}"
      },
      timing: [{
        repeat: {
          frequency: freqs[sig.frequency],
          period: 1,
          periodUnits: "d"
        }
      }]
    }];
  }
  if (props.server.get('selectionAsFhir')) {
    resource.reasonCodeableConcept = props.server.get('selectionAsFhir')
  }
  return Immutable.fromJS(resource)
}


var DecisionStore = assign({}, EventEmitter.prototype, {
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

DecisionStore.dispatchToken = AppDispatcher.register(function(action) {

  switch (action.type) {

    case ActionTypes.EXTERNAL_APP_RETURNED:
      _externalAppReturned()
      break

    case ActionTypes.LOADED:
      _rxChanged()
      break

    default:
  // do nothing
  }

})
FhirServerStore.addChangeListener(_rxChanged)
DrugStore.addChangeListener(_rxChanged)
DateStore.addChangeListener(_rxChanged)
HookStore.addChangeListener(_hooksChanged)

_hooksChanged()


module.exports = DecisionStore
