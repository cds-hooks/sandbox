import AppDispatcher from '../dispatcher/AppDispatcher';
import ActionTypes from '../actions/ActionTypes'
import DateStore from './DateStore';
import DrugStore from './DrugStore';
import assign from 'object-assign'
window.addEventListener('hashchange',hashListener);

function hashListener(e){
    AppDispatcher.dispatch({
      type: ActionTypes.NEW_HASH_STATE
    })
}

function publishStateFromStores(){
  var stateToPublish = {};
  stateToPublish = assign(
    {},
    DateStore.getStateToPublish(),
    DrugStore.getStateToPublish()
  );
  var newHash = `#${JSON.stringify(stateToPublish)}`;
  if (newHash != window.location.hash) {
    window.history.replaceState(undefined, undefined, newHash);
  }
}

export default publishStateFromStores;
