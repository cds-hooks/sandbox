var AppDispatcher = require('../dispatcher/AppDispatcher');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var debounce = require('debounce');

import rxnorm from '../rxnorm';
console.log("rxnorm" , rxnorm[0]);

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

var currentHits = examples;

var DrugStore = assign({}, EventEmitter.prototype, {
  getHits: function(){
    return currentHits
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
      currentHits = [];
    else 
      currentHits = rxnorm
    .filter(e=>
            parts
            .map(p=>e.str.match(RegExp(p, "i")))
            .every(x=>x))
            .sort((b,a)=> b.str.length - a.str.length)
            .slice(0,100);

            console.log("Hits", currentHits.length);
            DrugStore.emitChange();
  });
  console.log("Performed  a serach", action, (new Date().getTime() - t));
}, 120);


DrugStore.dispatchToken = AppDispatcher.register(function(action) {

  switch(action.type) {

    case ActionTypes.SEARCH_DRUGS:
      processSearch(action);
    break;

    default:
      // do nothing
  }

});

module.exports = DrugStore;
