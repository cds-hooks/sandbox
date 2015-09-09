import AppDispatcher from '../dispatcher/AppDispatcher';
import ActionTypes from '../actions/ActionTypes'
import DateStore from './DateStore';
import DrugStore from './DrugStore';
import assign from 'object-assign'
window.addEventListener('hashchange',hashListener);

function hashListener(e){
  console.log("duspatch it");
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
    console.log("expect publishing a difference:", newHash, window.location.hash);
    window.history.replaceState(undefined, undefined, newHash);
  }
}

export default publishStateFromStores;
