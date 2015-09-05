var AppDispatcher = require('../dispatcher/AppDispatcher');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var debounce = require('debounce');

import rxnorm from '../rxnorm';
var pills = Object.keys(rxnorm.pillToComponentSets).map(p=>{
  return {
    cui: p,
    str: rxnorm.cuiToName[p]
  }
});

console.log("Pills 4", pills.slice(0,5));

var CHANGE_EVENT = 'change';

import ActionTypes from '../actions/ActionTypes'
var _currentID = null;
var _threads = {};

var examples = [
  {
    "str": "Hydrochlorothiazide 25 MG / Metoprolol Tartrate 50 MG Oral Tablet",
    "form": "tablet",
    "ingredients":[
      ["metoprolol", "50mg"],
      ["hydrochlorothiazide", "25mg"]
    ]
  },{
    "str": "Metoprolol Tartrate 100 MG Oral Tablet",
    "form": "tablet",
    "ingredients": [
      ["metoprolol", "100mg"]
    ]
  },{
    "str": "Metoprolol Tartrate 50 MG Oral Tablet",
    "form": "tablet",
    "ingredients": [
      ["metoprolol", "50mg"]
    ]
  },{
    "str": "Hydrochlorothiazide 25 MG Oral Tablet",
    "form": "tablet",
    "ingredients": [
      ["hydrochlorothiazide", "25mg"]
    ]
  },
];

var nextStep = {
  "ingredient": "components",
  "components": "prescribable",
  "prescribable": "done"
};

var explicitStepHistory = ["ingredient"]; // components, prescribable
var step = "begin"; // components, prescribable

var options = {
  "ingredient": [],
  "components": [],
  "prescribable": []
}

var decisions = {
  "ingredient": null,
  "components": null,
  "prescribable": null
}

var currentHits = examples;
var currentDrug = null;
var currentForms = null;

var DrugStore = assign({}, EventEmitter.prototype, {
  getStatus: function(){
    return {
      step: step,
      options: options,
      decisions: decisions
    };
  },

  getHits: function(){
    return currentHits
  },
  getDrug: function(){
    return currentDrug
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
    if(parts.length == 0) 
      options.ingredient = [];
    else 
      options.ingredient = pills
    .filter(e=>
            parts
            .map(p=>e.str.match(RegExp("(?:^|\\s)" + p, "i")))
            .every(x=>x))
            .sort((b,a)=> b.str.length - a.str.length)
            .slice(0,30)
            .map(p=>{
              return { str: p.str.slice(0,-5), cui: p.cui};});

              console.log("Hits on", parts, options.ingredient.length);
              console.log("Performed  a serach", action, (new Date().getTime() - t));
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
      step = "ingredient";
    decisions.ingredient = decisions.components = decisions.prescribable = null;
    processSearch(action);
    break;

    case ActionTypes.PREVIOUS_STEP:
      step = explicitStepHistory.pop();
      if (step === "begin")
        options.ingredient = [];
      DrugStore.emitChange();
      break;

    case ActionTypes.PICK_DRUG:
      console.log("Action", action)
    if (!action.implicitChoice){
      explicitStepHistory.push(action.subtype);
    }
    if(action.subtype === "ingredient"){
      step = "components"
      decisions.ingredient = action.decision;
      options.components = makeComponents(decisions.ingredient);
    } else if (action.subtype == "components"){
      step = "prescribable"
      decisions.components = action.decision;
      options.prescribable = makePrescribable(decisions.components);
    } else if (action.subtype == "prescribable"){
      step = "done"
      decisions.prescribable = action.decision;
    }

    if (options[step] && options[step].length === 1) {
      process.nextTick(function() {
        AppDispatcher.dispatch({
          type: ActionTypes.PICK_DRUG,
          subtype: step,
          decision: options[step][0],
          implicitChoice: true
        })
      });
    } else {
      DrugStore.emitChange();
    }

    console.log("Piced", options);
    break;


    default:
      // do nothing
  }

});

module.exports = DrugStore;
