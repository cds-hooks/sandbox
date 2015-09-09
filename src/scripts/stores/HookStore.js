var AppDispatcher = require('../dispatcher/AppDispatcher');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var Immutable = require('immutable');
import ActionTypes from '../actions/ActionTypes'
import defaultHooks from './HookStore.defaults'

var CHANGE_EVENT = 'change';
var state = Immutable.fromJS({
  editing: null,
  hooks: restoreHooks()
});
console.log("state", state)

function saveHooks(state){
  window.localStorage["hooks"] = JSON.stringify(state.get('hooks'));
};

function restoreHooks(){
   try {
     var hooks = JSON.parse(window.localStorage["hooks"]);
     console.log("from storage");
     return Immutable.fromJS(hooks);
   } catch (e) {
     console.log("from defulits", defaultHooks);
    return Immutable.fromJS(defaultHooks);
   }
};

function resetHooks(){
  delete window.localStorage.hooks;
  state.set('hooks', restoreHooks());
};

var HookStore = assign({}, EventEmitter.prototype, {
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
