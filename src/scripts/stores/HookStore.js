var AppDispatcher = require('../dispatcher/AppDispatcher');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var Immutable = require('immutable');
import axios from 'axios'
import ActionTypes from '../actions/ActionTypes'
import defaultHooks from './HookStore.defaults'
import { schema, paramsToJson } from '../../../mock-cds-backend/utils.js'

var CHANGE_EVENT = 'change';
var state = Immutable.fromJS({
  editing: null,
  hooks: restoreHooks()
});

function saveHooks() {
  window.localStorage["hooks"] = JSON.stringify(state.get('hooks'));
  console.log("Hooks saved. To reset, run resetHooks()")
}

window.saveHooks = saveHooks
window.resetHooks = resetHooks

function restoreHooks() {
  try {
    var hooks = JSON.parse(window.localStorage["hooks"]);
    return Immutable.fromJS(hooks);
  } catch (e) {
    console.log("restore hooks from defaults", defaultHooks);
    return Immutable.fromJS(defaultHooks);
  }
}
;

function resetHooks() {
  delete window.localStorage.hooks;
  state.set('hooks', restoreHooks());
}

var HookStore = assign({}, EventEmitter.prototype, {
  getState: function() {
    return state
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

  switch (action.type) {

    case ActionTypes.QUICK_ADD_HOOK:
      axios({
        url: action.url + "-metadata",
        method: 'get',
      }).then(function(result){
        var hook = paramsToJson(result.data, schema.metadata)
        console.log("HOOK", hook)
        var generated = {
          id: action.url,
          enabled: true,
          url: action.url,
          activity: hook.activity.code,
          preFetchTemplate: hook.preFetchTemplate  && hook.preFetchTemplate.length > 0 ? {
            resourceType: "Bundle",
            type: "transaction",
            entry: hook.preFetchTemplate.map(u => ({
              request: {
                method: "GET",
                url: u
              }
            }))
          } : undefined
        }

        AppDispatcher.dispatch({
          type: ActionTypes.SAVE_HOOK,
          id: action.url,
          value: generated
        })

      })
      break;

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

    case ActionTypes.TOGGLE_ENABLED:
      var current = state.getIn(['hooks', action.id, 'enabled'])
      state = state.setIn(['hooks', action.id, 'enabled'], !current)
      HookStore.emitChange();
      break;

    case ActionTypes.SAVE_HOOK:
      if (!action.discard) {
        state = state.setIn(['hooks', action.value.id], Immutable.fromJS(action.value));
        if (action.id !== action.value.id) {
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
