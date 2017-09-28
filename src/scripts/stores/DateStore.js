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
    if (_dates.size === 0) {
      this.setDate("start", {
        date: moment().toDate(),
        enabled: true});
      this.setDate("end", {
        date: moment().add(1, 'month').toDate(),
        enabled: true});
    }
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
      var original = _dates;
      if (action.suggestion.hasOwnProperty('actions')) {
        var actions = action.suggestion.actions;
        var filteredActions = actions ? actions.filter((action) => { return action.type === 'create' || action.type === 'update' }) : [];
        var createOrUpdate = filteredActions.length? filteredActions[0] : [];
        if (createOrUpdate && createOrUpdate.resource && createOrUpdate.resource.startDate) {
          _dates = _dates.setIn(['start', 'value'], moment(createOrUpdate.resource.startDate).toDate())
        }
        if (createOrUpdate && createOrUpdate.resource && createOrUpdate.resource.endDate) {
          _dates = _dates.setIn(['end', 'value'], moment(createOrUpdate.resource.endDate).toDate())
        }
        if (!Immutable.is(original, _dates)) {
          DateStore.emitChange();
        }
      } else if (action.suggestion["create"] || action.suggestion["delete"]) { // Remove on complete transition to CDS Hooks 1.0 Spec
        console.error("CDS Service response is un-compliant with the CDS Hooks 1.0 spec for suggestions. " +
          "Please see http://cds-hooks.org/#cds-service-response for further information.");

        var create = action.suggestion.create[0];
        if (create.startDate) {
          _dates = _dates.setIn(['start', 'value'], moment(create.startDate).toDate())
        }
        if (create.endDate) {
          _dates = _dates.setIn(['end', 'value'], moment(create.endDate).toDate())
        }
        if (!Immutable.is(original, _dates)) {
          DateStore.emitChange();
        }
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
