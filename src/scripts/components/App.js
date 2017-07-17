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
import {Modal, Button, Alert, ListGroup, ListGroupItem} from 'react-bootstrap';
import $ from 'jquery';


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

  isSmartHealthItSandbox: function() {
    var fhirServerUrl = this.state.all.getIn(["fhirServer", "context", "baseUrl"]);
    return fhirServerUrl.toLowerCase().indexOf('smarthealthit.org') > 0;
  },

  changePatient: function(){
    var dfd = $.Deferred();

    // If input is empty, close the modal and keep current patient in context
    if (this.state.patientId === '' || !this.state.patientId) {
      this.hidePatientModal();
      this.setState({
        patientId: this.state.all.getIn(["fhirServer", "context", "patient"]),
        showPatientEntryError: false,
        patientEntryErrorCode: ''
      });
      dfd = $.Deferred();
      return;
    }
    var patientFetchResponse = FhirServerStore.checkPatientResponse(this.state.patientId, dfd);
    var currentPatientInContext = AppStore.getState().getIn(["fhirServer", "context", "patient"]);

    // Check if requested patient exists in the FHIR server
    patientFetchResponse.then(function(status) {
      if (status === 200) {
        this.hidePatientModal();
        this.setState({
          showPatientEntryError: false,
          patientEntryErrorCode: ''
        });
        FhirServerStore.setContext({ patient: this.state.patientId });
        dfd = $.Deferred();
      } else {
        this.setState({
          patientEntryErrorCode: status,
          showPatientEntryError: true,
          selectedPatient: currentPatientInContext
        });
        dfd = $.Deferred();
      }
    }.bind(this));
  },

  handlePatientChange: function(event) {
    this.setState({
      patientId: event.target.value.toString().trim()
    });
  },

  displayPatientModal: function() {
    this.setState({
      showPatientModal: true,
      patientId: AppStore.getState().getIn(["fhirServer", "context", "patient"]),
      selectedPatient: AppStore.getState().getIn(["fhirServer", "context", "patient"]),
    });
  },

  hidePatientModal: function() {
    this.setState({
      showPatientModal: false,
      showPatientEntryError: false
    });
  },

  hideModalAlert: function() {
    if (this.state.isNewPatientModalWindow) return 'remove-display';
    return this.state.showPatientEntryError ? '' : 'remove-display';
  },

  patientSelected: function(patientId) {
    this.setState({
      patientId: patientId,
      selectedPatient: patientId
    });
  },

  render() {
    var hook = (this.state.all.getIn(['decisions', 'hook']))
    var rxClass = hook === "medication-prescribe" ? "nav-button activity-on" : "nav-button activity-off"
    var ptClass = hook === "patient-view" ? "nav-button activity-on" : "nav-button activity-off"

    var patientSelectGroup =(
      <ListGroup>
        <ListGroupItem header='Daniel X. Adams'
                       onClick={this.patientSelected.bind(this, 'SMART-1288992')}
                       active={this.state.patientId === 'SMART-1288992'}>Male | DOB: 1925-12-23</ListGroupItem>
        <ListGroupItem header='Lisa P. Coleman'
                       onClick={this.patientSelected.bind(this, 'SMART-1551992')}
                       active={this.state.patientId === 'SMART-1551992'}>Female | DOB: 1948-04-14</ListGroupItem>
        <ListGroupItem header='Tiffany Westin'
                       onClick={this.patientSelected.bind(this, 'SMART-8888802')}
                       active={this.state.patientId === 'SMART-8888802'}>Female | DOB: 1975-05-20</ListGroupItem>
        <ListGroupItem header='Susan A. Clark'
                       onClick={this.patientSelected.bind(this, 'SMART-1482713')}
                       active={this.state.patientId === 'SMART-1482713'}>Female | DOB: 2000-12-27</ListGroupItem>
        <ListGroupItem header='Steve Richey'
                       onClick={this.patientSelected.bind(this, 'SMART-7777701')}
                       active={this.state.patientId === 'SMART-7777701'}>Male | DOB: 2011-09-16</ListGroupItem>
        <ListGroupItem header='Rose Tyler'
                       onClick={this.patientSelected.bind(this, 'BILIBABY6')}
                       active={this.state.patientId === 'BILIBABY6'}>Male | DOB: 2016-2-28</ListGroupItem>
      </ListGroup>);

    var patientModalAlert = this.state.showPatientEntryError ?
      (<Alert bsStyle="danger">
        <i className="glyphicon glyphicon-exclamation-sign" />
        <strong> Error fetching patient: </strong>
        Patient ID returned a <i>{this.state.patientEntryErrorCode}</i> from the FHIR server
      </Alert>) : ''

    var patientModal =(
      <Modal show={this.state.showPatientModal} onHide={this.hidePatientModal}>
        <Modal.Header closeButton>
          <Modal.Title>Choose a Patient</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {patientModalAlert}
          <div>
            <b>Current FHIR Server</b><br />
            <p>{this.state.all.getIn(["fhirServer", "context", "baseUrl"])}</p>
          </div>
          <div className="input-container">
            <label>Enter Patient ID:</label>
            <input className="form-control"
                   autoFocus={true}
                   placeholder={this.state.all.getIn(["fhirServer", "context", "patient"])}
                   type="text"
                   onChange={this.handlePatientChange}
            />
          </div>
          <div className={this.isSmartHealthItSandbox() ? '' : 'hidden'}>
            <div className="patient-modal-divider"><span>OR</span></div>
            <div className="input-container">
              <label>Select a Patient:</label>
              {patientSelectGroup}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button bsStyle="primary" onClick={this.changePatient}>Save</Button>
          <Button onClick={this.hidePatientModal}>Close</Button>
        </Modal.Footer>
      </Modal>);

    return (
      <div id="react-content">
        <div id="top-bar" className="app-header">
          <span className="header-brand"><i className="glyphicon glyphicon-flash"></i> <span className="brand-cds">CDS Hooks</span> Sandbox</span>
          <div className="header-nav">
            <a className={ptClass} onClick={e=>this.setActivity("patient-view")}>Patient View</a>
            <a className={rxClass} onClick={e=>this.setActivity("medication-prescribe")}>Rx View</a>
            <a className="nav-button change-patient" onClick={this.displayPatientModal}>Change Patient</a>
            {patientModal}
          </div>
        </div>

        <HookEditor hooks={this.state.all.getIn(['hooks', 'hooks'])} editing={this.state.all.getIn(['hooks', 'editing'])} />

        {
          hook === 'medication-prescribe' && <RxActivity all={this.state.all}/>
        }
        {
          hook === 'patient-view' && <PatientViewActivity all={this.state.all}/>
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
