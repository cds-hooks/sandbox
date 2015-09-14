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
      start: moment(_dates.getIn(['start', 'value'])).format("YYYY-MM-DD"),
      end: moment(_dates.getIn(['end', 'value'])).format("YYYY-MM-DD")
    }
  },

  getDates: function(){
    return _dates.toJS()
  },

  setDate: function(id, {date, enabled}){
  var toMerge = {};
  toMerge[id] = {value: date || new Date(), enabled: !!enabled};
    _dates = _dates.mergeDeep(toMerge);
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

    case ActionTypes.TAKE_SUGGESTION:
      var original = _dates, alternative = action.suggestion.alternative
      if (alternative.startDate) {
        _dates = _dates.setIn(['start', 'value'], moment(alternative.startDate).toDate())
      }
      if (alternative.endDate) {
        _dates = _dates.setIn(['end', 'value'], moment(alternative.endDate).toDate())
      }
      if (!Immutable.is(original, _dates)) {
        DateStore.emitChange();
      }
      break;

    case ActionTypes.OFFER_DATES:
      _dates = _dates.mapEntries(([k,v]) => [
        k,
        (k === action.id) ? v.set('picking', true) : v.set('picking', false)
      ]);
      DateStore.emitChange();
      break;

    case ActionTypes.SELECT_DATE:
      _dates = _dates.setIn([action.id, 'value'], action.decision);
      _dates = _dates.setIn([action.id, 'picking'], false);
      DateStore.emitChange();
    break;
    case ActionTypes.TOGGLE_DATE_ENABLED:
      _dates = _dates.setIn([action.id, 'enabled'], action.enabled);
      DateStore.emitChange();
    break;



    default:
      // do nothing
  }

});

module.exports = DateStore;
