var AppDispatcher = require('../dispatcher/AppDispatcher');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var debounce = require('debounce');
import ActionTypes from '../actions/ActionTypes'

var CHANGE_EVENT = 'change';

var _dates = {

};

var DateStore = assign({}, EventEmitter.prototype, {
  getDates: function(){
    return _dates;
  },

  setDate: function(id, date){
    _dates[id] = date || new Date();
  },

  emitChange: function() {
    this.emit(CHANGE_EVENT);
  },

  addChangeListener: function(callback) {
    this.on(CHANGE_EVENT, callback);
  },

  removeChangeListener: function(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  }

});

DateStore.dispatchToken = AppDispatcher.register(function(action) {

  switch(action.type) {

    case ActionTypes.SELECT_DATE:
      _dates[action.id] = action.decision;
      DateStore.emitChange();
    break;


    default:
      // do nothing
  }

});

module.exports = DateStore;
