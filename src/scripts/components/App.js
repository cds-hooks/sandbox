import AppDispatcher from '../dispatcher/AppDispatcher';
import ActionTypes from '../actions/ActionTypes'
import React from 'react';
import DrugSelector from './DrugSelector';
import ProblemSelector from './ProblemSelector';
import DateBox from './DateBox';
import FhirView from './FhirView';
import HookEditor from './HookEditor';
import Cards from './Cards';
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

const App = React.createClass({

  componentDidMount: function() {
    AppStore.addChangeListener(this._onChange);
    AppDispatcher.dispatch({
      type: ActionTypes.NEW_HASH_STATE,
      hash: JSON.parse(window.location.hash.slice(1))
    })
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

  render() {
    return (
      <div id="react-content">
        <div id="top-bar">CDS Hooks: Rx Demo
        </div>

      <div id="main">
        <div className="OrderEntry container">
        <div className="row">
        <ProblemSelector
          conditions={this.state.all.getIn(['fhirServer', 'conditions'])} 
          selection={this.state.all.getIn(['fhirServer', 'selection'])}
        />
        </div>
        <DrugSelector {...this.state.all.get('drug').toJS()} />
        <div className="row">
        <DateBox id="start" display="Start date" {...this.state.all.get('dates').start} />
        <DateBox id="end" display="End date" {...this.state.all.get('dates').end} />
      </div>
        <div className="decision-spacer"></div>
      <Cards className="card-holder" decisions={this.state.all.get('decisions')} />
        </div>
        <FhirView {...this.state} />
      </div>
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
