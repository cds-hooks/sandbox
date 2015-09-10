var AppDispatcher = require('../dispatcher/AppDispatcher');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var Immutable = require('immutable');
import axios from 'axios'
import ActionTypes from '../actions/ActionTypes'
import defaultHooks from './HookStore.defaults'
import DateStore from './DateStore'
import DrugStore from './DrugStore'
import HookStore from './HookStore'

var CHANGE_EVENT = 'change';
var state = Immutable.fromJS({
  fhir: {},
  additions: [],
  cards: []
});

var preFetchData = Promise.resolve({});

DrugStore.addChangeListener(_rxChanged);
DateStore.addChangeListener(_rxChanged);
HookStore.addChangeListener(_hooksChanged);

_hooksChanged();

function getFhirContext(){
  return {
    "base":  "http://localhost:9080/",
    "Patient.id": "99912345"
  }
}

function fillTemplate(template, context){
  console.log("template", typeof template)
  var flat = JSON.stringify(template)
             .replace(/{{\s*Patient\.id\s*}}/g, context["Patient.id"]);
  return JSON.parse(flat);
}

function _hooksChanged(){
  var context = getFhirContext();
  var hooks = HookStore.getState().hooks;
  var hookNames = Object.keys(hooks);
  state = state.set('hooks', hooks);
  state = state.set('preFetchData', Promise.all(hookNames.map(h=>
    axios({
      url: context.base,
      method: 'post',
      data: fillTemplate(hooks[h].preFetchTemplate, context)
    })
  )).then(preFetchResults =>
    preFetchResults.reduce(
      (r, coll, i) => coll.set(hooks[hookNames[i]].url),
    Immutable.fromJS({})) 
  ));

  console.log("Current", state.get('preFetchData'));
  state.get('preFetchData').then(results =>
    console.log("Got prefetch!", results)
  ).catch(err=>console.log(err));
}

function _rxChanged(){
  var props = {
    dates: DateStore.getDates(),
    drug: DrugStore.getState()
  };

  var resource = toFhir(props);
  if (!Immutable.is(resource, state.get('fhir'))){
    state = state.set('fhir', resource);
  }
  DecisionStore.emit(CHANGE_EVENT);
  callHooks(state);
}

function callHooks(state){
  state.get('preFetchData').then(()=>{
    var results = state.get('hooks').map((hname, h)=>
     axios({
        url: h.url,
        method: 'post',
        data: hookBody(h)
      }) 
    );
    Promise.all(results).then(responses =>{
      console.log("Got all responses", responses);
      DecisionStore.emit(CHANGE_EVENT);
    })
  });
}

function toFhir(props){
    var resource = {
      "resourceType": "MedicationOrder"
    }
    if (props.dates.start.enabled)
    resource.startDate = moment(props.dates.start.value).format("YYYY-MM-DD");
    if (props.dates.end.enabled)
    resource.endDate = moment(props.dates.end.value).format("YYYY-MM-DD");
    resource.status = "draft";
    resource.patient = {"reference": "Patient/example"};
    if (props.drug && props.drug.step === "done") {
      var med = props.drug.decisions.prescribable;
      resource.medicationCodeableConcept = {
        "text": med.str,
        "coding": [{
          "display": med.str,
          "system": "http://www.nlm.nih.gov/research/umls/rxnorm",
          "code": med.cui
        }]
      };
    }
    return Immutable.toJS(resource);
  }


var DecisionStore = assign({}, EventEmitter.prototype, {
  getState: function(){
    return state.toJS();
  },

  emitChange: function() {
    this.emit(CHANGE_EVENT);
  },

  /**
   * @param {function} callback
   */
  addChangeListener: function(callback) {
    this.on(CHANGE_EVENT, callback);
  },

  /**
   * @param {function} callback
   */
  removeChangeListener: function(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  }


});

HookStore.dispatchToken = AppDispatcher.register(function(action) {

    console.log("hook aciton", action);
  switch(action.type) {

    case ActionTypes.NEW_HOOK:
      state = state.set('editing', true)
      state = state.set('current', null)
      HookStore.emitChange();
      break;

    case ActionTypes.EDIT_HOOK:
      state = state.set('editing', true)
      state = state.set('current', action.id)
      HookStore.emitChange();
      break;


    case ActionTypes.SAVE_HOOK:
      console.log("save", action)
      if (!action.discard) {
        state = state.setIn(['hooks', action.value.id], action.value);
        if (action.id !== action.value.id){
          state = state.deleteIn(['hooks', action.id]);
        }
      } else {
        state = state.set('editing', false);
      }
      HookStore.emitChange();
      break;

    case ActionTypes.DELETE_HOOK:
      state = state.deleteIn(['hooks', action.id]);
      HookStore.emitChange();
      break;

    default:
      // do nothing
  }

});

module.exports = HookStore;
