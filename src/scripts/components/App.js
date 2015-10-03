import AppDispatcher from '../dispatcher/AppDispatcher';
import ActionTypes from '../actions/ActionTypes'
import React from 'react';
import RxActivity from './RxActivity';
import PatientViewActivity from './PatientViewActivity';
import HookEditor from './HookEditor';
import AppStore from '../stores/AppStore'
import DateStore from '../stores/DateStore'
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
        return {all: AppStore.getState()}
  },

  setActivity(code){
    AppDispatcher.dispatch({
      type: ActionTypes.SET_ACTIVITY,
      activity: code
    })
  },

  render() {
    var activity = (this.state.all.getIn(['decisions', 'activity']))
    var rxClass = activity === "medication-prescribe" ? "activity-on" : "activity-off"
    var ptClass = activity === "patient-view" ? "activity-on" : "activity-off"

    return (
      <div id="react-content">
        <div id="top-bar">
          <span>CDS Hooks Demo: </span>
          <a className={rxClass} onClick={e=>this.setActivity("medication-prescribe")}>Rx</a>
          <span> | </span>
          <a className={ptClass} onClick={e=>this.setActivity("patient-view")}>Pt</a>
        </div>
        {
          activity === 'medication-prescribe' &&
            <RxActivity all={this.state.all}/>
            }
            {
              activity === 'patient-view' &&
                <PatientViewActivity all={this.state.all}/>
                }

                <div id="bottom-bar">
                  SMART Health IT —
                  About <a href="https://github.com/jmandel/cds-hooks/wiki">CDS Hooks</a> —
                  Rx Demo <a href="https://github.com/jmandel/cds-hooks-rx-app">source code</a>

                  <HookEditor
                    hooks={this.state.all.getIn(['hooks', 'hooks'])}
                    editing={this.state.all.getIn(['hooks', 'editing'])} />
                </div>
              </div>
    )
  }
});

module.exports = App;
