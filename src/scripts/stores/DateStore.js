var AppDispatcher = require('../dispatcher/AppDispatcher');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var debounce = require('debounce');
import moment from 'moment';
import ActionTypes from '../actions/ActionTypes'
import Immutable from 'immutable'

var CHANGE_EVENT = 'change';

var _dates = Immutable.fromJS({ });

var DateStore = assign({}, EventEmitter.prototype, {
  getStateToPublish(){
    return {
      start: moment(_dates.get('start')).format("YYYY-MM-DD"),
      end: moment(_dates.get('end')).format("YYYY-MM-DD")
    }
  },

  getDates: function(){
    console.log(_dates.toJS());
    return _dates.toJS();
  },

  setDate: function(id, date){
    _dates = _dates.set(id, date || new Date());
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
      _dates = _dates.set(action.id, action.decision);
      DateStore.emitChange();
    break;


    default:
      // do nothing
  }

});

module.exports = DateStore;
