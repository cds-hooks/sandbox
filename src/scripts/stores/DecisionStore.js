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
  'card': [{
    'summary': 1,
    'source': 1,
    'indicator': 1,
    'suggestion': [{
      'label': 1,
      'alternative': 1
    }],
    'link': [{
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
FhirServerStore.addChangeListener(_rxChanged)
DrugStore.addChangeListener(_rxChanged)
DateStore.addChangeListener(_rxChanged)
HookStore.addChangeListener(_hooksChanged)

_hooksChanged()

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
  
  var hooksToFetch = hooks.valueSeq().filter(h=>h.get('preFetchTemplate'));

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
    setTimeout(()=>callHooks(state), DELAY)
  }
}

var _sessionUuid = uuid.v4()

var launchService = {
  createLaunch() {
    return _sessionUuid
  }
}

var _base = window.location.protocol + "//" + window.location.host + window.location.pathname;
if (!_base.match(/.*\//)){
   _base += "/";
}

function hookBody(h, fhir, preFetchData) {
  var ret =  {
    "resourceType": "Parameters",
    "parameter": [{
      "name": "launch",
      "valueString": launchService.createLaunch()
    }, {
      "name": "redirect",
      "valueString": _base + "service-done.html"
    }, {
      "name": "intent",
      "valueString": "evaluate-prescription"
    }, {
      "name": "content",
      "resource": fhir
    }, {
      "name": "pre-fetch-data",
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
  if (state.get('callCount') !== callCount){
    return;
  }
  var cards = paramsToJson(result.data, decisionSchema)['card'];
  cards = Immutable.fromJS(cards).map((v, k) =>
              v.set('key', cardKey++)
              .set('suggestion', v.get('suggestion').map(s=>s.set("key", cardKey++)))
              .set('link', v.get('link').map(s=>s.set("key", cardKey++)))
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
  localState.get('preFetchData').then((preFetchData) => {
    var results = localState.get('hooks').map((h, hookUrl) => axios({
        url: h.get('url'),
        method: 'post',
        data: hookBody(h, localState.get('fhir').toJS(), preFetchData.get(h.get('url')))
      }))
      .forEach((p, hookUrl) => p.then(result => addCardsFrom(myCallCount, hookUrl, result)))
  })
}

function toFhir(props) {
  var resource = {
    "resourceType": "MedicationOrder"
  }
  if (props.dates.start.enabled)
    resource.startDate = moment(props.dates.start.value).format("YYYY-MM-DD")
  if (props.dates.end.enabled)
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

  if (props.drug.get('sig')){
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
  if (props.server.get('selectionAsFhir')){
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

module.exports = DecisionStore
