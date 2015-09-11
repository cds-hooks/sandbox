import AppDispatcher from '../dispatcher/AppDispatcher';
import ActionTypes from '../actions/ActionTypes'
import React from 'react';
import DrugSelector from './DrugSelector';
import DateBox from './DateBox';
import FhirView from './FhirView';
import HookEditor from './HookEditor';
import DateStore from '../stores/DateStore';
import DrugStore from '../stores/DrugStore';
import HookStore from '../stores/HookStore';
import DecisionStore from '../stores/DecisionStore';
import HashStateStore from '../stores/HashStateStore';
import {EventEmitter} from 'events';
import moment from 'moment'


window.bodyClicks = new EventEmitter();
document.body.addEventListener("click", bodyClick);
function bodyClick(e) {
  bodyClicks.emit('click', e);
  AppDispatcher.dispatch({
    type: ActionTypes.BODY_CLICK,
    event: e
  })
};

const App = React.createClass({

  componentDidMount: function() {
    DrugStore.addChangeListener(this._onChange);
    DateStore.addChangeListener(this._onChange);
    DecisionStore.addChangeListener(this._onChange);
    HookStore.addChangeListener(this._onChange);
    AppDispatcher.dispatch({
      type: ActionTypes.NEW_HASH_STATE
    })
  },

  componentWillUnmount: function() {
    DrugStore.removeChangeListener(this._onChange);
    DecisionStore.removeChangeListener(this._onChange);
    DateStore.removeChangeListener(this._onChange);
    HookStore.removeChangeListener(this._onChange);
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
      drug: DrugStore.getState(),
      hooks: HookStore.getState(),
      decisions: DecisionStore.getState()
    }
  },

  getInitialState() {
    DateStore.setDate("start", {
      date: moment().toDate(),
      enabled: true});
    DateStore.setDate("end", {
      date: moment().add(28, 'days').toDate(),
      enabled: false});
    AppDispatcher.dispatch({ type: ActionTypes.LOADED })
    return this.getStateFromStores();
  },

  render() {
    return (
      <div id="react-content">
    <div id="top-bar">SMART CDS Hooks: EHR Demo</div>

      <div id="main">
        <div className="OrderEntry">
        <DrugSelector {...this.state.drug} />
        <DateBox id="start" display="Start date" {...this.state.dates.start} />
        <DateBox id="end" display="End date" {...this.state.dates.end} />
        </div>
        <FhirView {...this.state} />
      </div>
      <HookEditor {...this.state.hooks} />
    <div id="bottom-bar">
      SMART Health IT —
      About <a href="https://github.com/jmandel/cds-hooks/wiki">CDS Hooks</a> —
      Source <a href="https://github.com/jmandel/cds-hooks-rx-app">on GitHub</a>
    </div>
      </div>
    )
  }
});

module.exports = App;
