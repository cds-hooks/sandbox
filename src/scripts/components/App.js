import AppDispatcher from '../dispatcher/AppDispatcher';
import ActionTypes from '../actions/ActionTypes'
import React from 'react';
import RxActivity from './RxActivity';
import PatientViewActivity from './PatientViewActivity';
import HookEditor from './HookEditor';
import AppStore from '../stores/AppStore'
import DateStore from '../stores/DateStore'
import FhirServerStore from '../stores/FhirServerStore'
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

console.log("dispatching")
AppDispatcher.dispatch({
  type: ActionTypes.NEW_HASH_STATE,
  hash: window.location.hash.slice(1) ? JSON.parse(window.location.hash.slice(1)) : {}
})
console.log("DIspatched")

const App = React.createClass({

  componentDidMount: function() {
    AppStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function() {
    AppStore.removeChangeListener(this._onChange);
  },

  _onChange: function(){
    HashStateStore();
    this.setState({all: AppStore.getState()});
  },

  getInitialState() {
    DateStore.setDate("start", {
      date: moment().toDate(),
      enabled: true});
      DateStore.setDate("end", {
        date: moment().add(1, 'month').toDate(),
        enabled: true});
        AppDispatcher.dispatch({ type: ActionTypes.LOADED })
        return {all: AppStore.getState(),
        settingContext: false}
  },

  setActivity(code){
    AppDispatcher.dispatch({
      type: ActionTypes.SET_ACTIVITY,
      hook: code
    })
  },

  changePatient(){
    var pid = this.state.all.getIn(["fhirServer", "context", "patient"])
    pid = window.prompt("Patient ID", pid)
    if (pid) FhirServerStore.setContext({patient: pid})
  },

  render() {
    var hook = (this.state.all.getIn(['decisions', 'hook']))
    var rxClass = hook === "medication-prescribe" ? "nav-button activity-on" : "nav-button activity-off"
    var ptClass = hook === "patient-view" ? "nav-button activity-on" : "nav-button activity-off"

    return (
      <div id="react-content">
        <div id="top-bar" className="app-header">
          <span className="header-brand"><i className="glyphicon glyphicon-flash"></i> <span className="brand-cds">CDS Hooks</span> Sandbox</span>
          <div className="header-nav">
            <a className={rxClass} onClick={e=>this.setActivity("medication-prescribe")}>Rx View</a>
            <a className={ptClass} onClick={e=>this.setActivity("patient-view")}>Patient View</a>
            <a className="nav-button change-patient" onClick={this.changePatient}>Change Patient</a>
          </div>
        </div>

        <HookEditor hooks={this.state.all.getIn(['hooks', 'hooks'])} editing={this.state.all.getIn(['hooks', 'editing'])} />

        {
          hook === 'medication-prescribe' &&
            <RxActivity all={this.state.all}/>
            }
            {
              hook === 'patient-view' &&
                <PatientViewActivity all={this.state.all}/>
                }

                <div id="bottom-bar" className="app-footer">
                  SMART Health IT —
                  About <a href="http://cds-hooks.org">CDS Hooks</a> —
                  Sandbox <a href="https://github.com/cds-hooks/sandbox">source code</a>


                </div>
              </div>
    )
  }
});

module.exports = App;
