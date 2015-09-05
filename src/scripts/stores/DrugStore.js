var AppDispatcher = require('../dispatcher/AppDispatcher');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var debounce = require('debounce');
var Immutable = require('immutable');
import rxnorm from '../rxnorm';
import ActionTypes from '../actions/ActionTypes'

var pills = Object.keys(rxnorm.pillToComponentSets).map(p=>{
  return {
    cui: p,
    str: rxnorm.cuiToName[p]
  }
});

var CHANGE_EVENT = 'change';

var explicitStepHistory = ["begin"]; // components, prescribable

var state = Immutable.fromJS({
  options: {
    "ingredient": [],
    "components": [],
    "prescribable": []
  },
  decisions: {
    "ingredient": null,
    "components": null,
    "prescribable": null
  },
  step: "begin"
})

var currentDrug = null;
var currentForms = null;

var DrugStore = assign({}, EventEmitter.prototype, {
  getState: function(){
    return state.toJS();
  },

  emitChange: function() {
    console.log("Emit change now")
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

var processSearch = debounce(function(action){
  var t = new Date().getTime();

  var parts = action.q
  .split(/\s+/)
  .filter(x=>x != "");

  process.nextTick(function() {
    console.log("parts", parts)
    var newIngredients;
    if(parts.length == 0)
      newIngredients = [];
    else
      newIngredients = pills
    .filter(e=>
            parts
            .map(p=>e.str.match(RegExp("(?:^|\\s)" + p, "i")))
            .every(x=>x))
            .sort((b,a)=> b.str.length - a.str.length)
            .slice(0,30)
            .map(p=>{
              return { str: p.str.slice(0,-5), cui: p.cui};});
              console.log("Search done on", parts)
    state = state.setIn(['options', 'ingredient'], newIngredients);
    DrugStore.emitChange();
  });
}, 50);

function makeComponents(ingredient){
  console.log("make compeonts form", ingredient)
  return rxnorm.pillToComponentSets[ingredient.cui]
  .map(function(set){
    return {
      str: set.map(cui => rxnorm.cuiToName[cui]).join(" / "),
      cui: set
    }
  }).sort(compareDrugNames);
}


function toNums(a){
  return a.str.match(/(\d*\.?\d*)/g)
  .filter(v=>v.length > 0)
  .map(d=>Number(d))
  .filter(n=>!isNaN(n));
}
function compareArrays(a,b){
  if (a.length === 0 && b.length === 0){
    return 0;
  }
  if (a.length === 0){
    return 1;
  }
  if (b.length === 0){
    return -1
  }
  if (a[0] < b[0]) {
    return -1;
  }
  if (a[0] > b[0]){
    return 1;
  }
  return compareArrays(a.slice(1), b.slice(1));
}
function compareDrugNames(a, b){
  console.log("Comare drug names", a, b);
  return compareArrays(toNums(a), toNums(b));
}

function makePrescribable(components){
  return rxnorm.componentSetsToPrescribables[components.cui.join(",")]
  .map(p => {
    return {
      str: rxnorm.cuiToName[p],
      cui: p
    }
  }).sort(compareDrugNames);
}


DrugStore.dispatchToken = AppDispatcher.register(function(action) {

  switch(action.type) {

    case ActionTypes.SEARCH_DRUGS:
      state = state.merge({
        'step': 'ingredient',
        'decisions': {
          'ingredient': null,
          'components': null,
          'prescribable': null
        }
      });
    processSearch(action);
    break;

    case ActionTypes.PREVIOUS_STEP:
      var prevStep = explicitStepHistory.pop();
      state = state.set('step',  prevStep || 'begin');
      console.log("Transition back to", state.get('step'), explicitStepHistory);
      if (state.get('step') === "begin")
        state.setIn(['options', 'ingredient'], []);
      DrugStore.emitChange();
      break;

    case ActionTypes.PICK_DRUG:
    if (!action.implicitChoice){
      explicitStepHistory.push(action.subtype);
    }
    if(action.subtype === "ingredient"){
      state = state.mergeDeep({
        'step': 'components',
        'decisions': {'ingredient': action.decision}
      });
      state = state.setIn(['options', 'components'], makeComponents(action.decision));
    } else if (action.subtype == "components"){
      state = state.mergeDeep({
        'step': 'prescribable',
        'decisions': {'components': action.decision},
      });
      state = state.setIn(['options', 'prescribable'], makePrescribable(action.decision));
    } else if (action.subtype == "prescribable"){
      state = state.mergeDeep({
        'step': 'done',
        'decisions': {'prescribable': action.decision}
      });
    }

    var step = state.get('step');
    var options = state.getIn(['options', step]);
    console.log("get ste", step, state.toJS(), options);
    if (options && options.length == 1) {
      process.nextTick(function() {
        console.log("impolict ips", typeof step, options);
        var onlyChoice = options[0]
        AppDispatcher.dispatch({
          type: ActionTypes.PICK_DRUG,
          subtype: step,
          decision: onlyChoice,
          implicitChoice: true
        })
      });
    } else {
      DrugStore.emitChange();
    }

    break;


    default:
      // do nothing
  }

});

module.exports = DrugStore;
