import AppDispatcher from '../dispatcher/AppDispatcher';
import ActionTypes from '../actions/ActionTypes'
import DateStore from './DateStore';
import DrugStore from './DrugStore';
import FhirServerStore from './FhirServerStore';
import assign from 'object-assign'
window.addEventListener('hashchange',hashListener);

function hashListener(e){
  console.log("Hash listened to",e)
    AppDispatcher.dispatch({
      type: ActionTypes.NEW_HASH_STATE,
      hash: JSON.parse(window.location.hash.slice(1))
    })
}

function publishStateFromStores(){
  var stateToPublish = {};
  stateToPublish = assign(
    {},
    //DateStore.getStateToPublish(),
    DrugStore.getStateToPublish(),
    FhirServerStore.getStateToPublish()
  );
  var newHash = `#${JSON.stringify(stateToPublish)}`;
  if (newHash != window.location.hash) {
    window.history.replaceState(undefined, undefined, newHash);
  }
}

export default publishStateFromStores;
