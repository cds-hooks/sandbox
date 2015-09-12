import axios from 'axios'
import ActionTypes from '../actions/ActionTypes'
import defaultHooks from './HookStore.defaults'
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

var decisionSchema = {
  'card': [{
    'summary': 1,
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
DrugStore.addChangeListener(_rxChanged)
DateStore.addChangeListener(_rxChanged)
HookStore.addChangeListener(_hooksChanged)

_hooksChanged()

function getFhirContext() {
  return {
    "base": "http://localhost:9080/",
    "Patient.id": "99912345"
  }
}

function fillTemplate(template, context) {
  console.log("template", typeof template)
  var flat = JSON.stringify(template)
    .replace(/{{\s*Patient\.id\s*}}/g, context["Patient.id"])
  return JSON.parse(flat)
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
  console.log("so new hooks", hooks.toJS())
  var hookFetches = hooks.valueSeq()
  .filter(h=>h.get('preFetchTemplate'))
  .map(h => axios({
      url: context.base,
      method: 'post',
      data: fillTemplate(h.get('preFetchTemplate'), context)
    })
  ).toJS()

  state = state.set('preFetchData', Promise.all(hookFetches)
    .then(preFetchResults => preFetchResults.reduce(
        (coll, r, i) => coll.set(hooks.getIn([hookNames.get(i), 'url']), r.data),
        Immutable.fromJS({}))
  ))

  state.get('preFetchData').then(results => {
    console.log("Got prefetch!", results.toJS())
    callHooks(state)
  }).catch(err => console.log(err))
}

function _rxChanged() {
  var props = {
    dates: DateStore.getDates(),
    drug: DrugStore.getState()
  }

  var resource = toFhir(props)
  if (!Immutable.is(resource, state.get('fhir'))) {
    console.log("Changed to", state.get('fhir').toJS())
    state = state.set('fhir', resource)
    state = state.set('cards', Immutable.List())
    DecisionStore.emitChange()
    callHooks(state)
  }
}

var launchService = {
  createLaunch() {
    return uuid.v4()
  }
}

function hookBody(h, fhir, preFetchData) {
  return {
    "resourceType": "Parameters",
    "parameter": [{
      "name": "launch",
      "valueString": launchService.createLaunch()
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
}

function addCardsFrom(callCount, hookUrl, result) {
  console.log("Result", hookUrl, result.data)
  if (!result.data) {
    return;
  }
  if (state.get('callCount') !== callCount){
    return;
  }
  var cards = paramsToJson(result.data, decisionSchema)['card'];
  console.log("Adding cards", cards)
  var newCards = state.get('cards').push(...cards)
  state = state.set('cards', newCards)
  console.log("Extracted cards", cards)
  DecisionStore.emitChange()
}

var callCount = 0;
function callHooks(localState) {
  var myCallCount = callCount++;
  console.log("Calling hooks...")
  state = state.set('cards', Immutable.fromJS([]));
  state = state.set('callCount', myCallCount)
  console.log("Calling # hooks", localState.get('hooks').count())
  localState.get('preFetchData').then((preFetchData) => {
    var results = localState.get('hooks').map((h, hookUrl) => axios({
        url: h.get('url'),
        method: 'post',
        data: hookBody(h, localState.get('fhir').toJS(), preFetchData[h.get('url')])
      }))
      .forEach((p, hookUrl) => p.then(result => addCardsFrom(myCallCount, hookUrl, result)))
    console.log("WAIT", results)
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
  if (props.drug && props.drug.step === "done") {
    var med = props.drug.decisions.prescribable
    resource.medicationCodeableConcept = {
      "text": med.str,
      "coding": [{
        "display": med.str,
        "system": "http://www.nlm.nih.gov/research/umls/rxnorm",
        "code": med.cui
      }]
    }
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

    case ActionTypes.LOADED:
      _rxChanged()

      break

    default:
  // do nothing
  }

})

module.exports = DecisionStore
