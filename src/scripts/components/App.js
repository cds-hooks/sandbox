import AppDispatcher from '../dispatcher/AppDispatcher';
import ActionTypes from '../actions/ActionTypes'
import React from 'react';
import DrugSelector from './DrugSelector';
import DateBox from './DateBox';
import FhirView from './FhirView';
import DateStore from '../stores/DateStore';
import DrugStore from '../stores/DrugStore';
import HashStateStore from '../stores/HashStateStore';
import {EventEmitter} from 'events';

window.bodyClicks = new EventEmitter();
function bodyClick(e) {
  bodyClicks.emit('click', e);
  AppDispatcher.dispatch({
    type: ActionTypes.BODY_CLICK,
    event: e
  })
};
document.body.addEventListener("click", bodyClick);

const App = React.createClass({

  componentDidMount: function() {
    DrugStore.addChangeListener(this._onChange);
    DateStore.addChangeListener(this._onChange);
    AppDispatcher.dispatch({
      type: ActionTypes.NEW_HASH_STATE
    })
  },


  componentWillUnmount: function() {
    DrugStore.removeChangeListener(this._onChange);
    DateStore.removeChangeListener(this._onChange);
  },

  _onChange: function(){
    //TODO avoid mutation. Immutable.js?
    var next = this.getStateFromStores();
    HashStateStore();
    this.setState(next);
  },

  getStateFromStores() {
    return {
      dates: DateStore.getDates(),
      drug: DrugStore.getState()
    }
  },

  getInitialState() {
    DateStore.setDate("start");
    DateStore.setDate("end");
    return this.getStateFromStores();
  },

  render() {
    console.log("Render with", this.state);
    return (
      <div onClick={this.bodyClick}>
      <div className="OrderEntry">
      <DrugSelector {...this.state.drug} />
      <h3>Start date</h3>
      <DateBox id="start" {...this.state.dates.start} />
      <h3>End date</h3>
      <DateBox id="end" {...this.state.dates.end} />
      </div>
      <FhirView {...this.state} />
      </div>
    )
  }
});

module.exports = App;
