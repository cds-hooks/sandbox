import AppDispatcher from '../dispatcher/AppDispatcher';
import ActionTypes from '../actions/ActionTypes'
import React from 'react';
import RxActivity from './RxActivity';
import PatientViewActivity from './PatientViewActivity';
import CardRenderActivity from './CardRenderActivity';
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

if(window.location.hash.slice(1).indexOf('state=') < 0) {
  AppDispatcher.dispatch({
    type: ActionTypes.NEW_HASH_STATE,
    hash: window.location.hash.slice(1) ? JSON.parse(window.location.hash.slice(1)) : {}
  })
} else {
  AppDispatcher.dispatch({
    type: ActionTypes.NEW_HASH_STATE,
    hash: {}
  })
}

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
    AppDispatcher.dispatch({ type: ActionTypes.LOADED })
    return {
      all: AppStore.getState(),
      settingContext: false,
      consoleLogSettingEnabled: true,
      serviceContextViewEnabled: true,
      isMainHooksView: true,
    }
  },

  setConsoleLogSetting(event) {
    this.setState({
      consoleLogSettingEnabled: event
    });
  },

  setServiceContextViewSetting() {
    this.setState({
      serviceContextViewEnabled: !this.state.serviceContextViewEnabled
    });
  },

  setActivity(code){
    AppDispatcher.dispatch({
      type: ActionTypes.SET_ACTIVITY,
      hook: code
    });
  },

  isHSPCSandbox: function() {
    var fhirServerUrl = this.state.all.getIn(["fhirServer", "context", "baseUrl"]);
    return fhirServerUrl.toLowerCase().indexOf('hspconsortium.org') > 0;
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
      if (status === 200 || status === 'success') {
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

  changeFhirServer: function() {
    var dfd = $.Deferred();

    if (this.state.fhirServer === '' || !this.state.fhirServer || !this.state.fhirServer.trim()) {
      this.setState({
        showFhirServerEntryError: true,
        fhirServerEntryErrorCode: '',
        fhirAlertMessage: 'Enter a valid FHIR server base URL'
      });
      dfd = $.Deferred();
      return;
    }

    var checkUrl = this.state.fhirServer.trim();
    if (!/^(https?:)?\/\//i.test(checkUrl)) {
      checkUrl = 'http://' + checkUrl;
      this.setState({
        fhirServer: checkUrl
      });
    }

    var serverFetchResponse = FhirServerStore.checkFhirServerResponse(checkUrl, dfd);

    // Check if requested FHIR Server contains metadata endpoint
    serverFetchResponse.then(function(response) {
      if (response && (response.status === 200 || response.status === 'success')) {
        this.hideFhirModal();
        if(((response.data.url && response.data.url.indexOf('https') > -1) ||
          (response.url && response.url.indexOf('https') > -1))
          && this.state.fhirServer.indexOf('https') < 0) {
          var tempUrlString = this.state.fhirServer;
          this.setState({
            showFhirServerEntryError: false,
            fhirServerEntryErrorCode: '',
            fhirServer: tempUrlString.replace("http", "https")
          });
        } else {
          this.setState({
            showFhirServerEntryError: false
          });
        }
        AppDispatcher.dispatch({
          type: ActionTypes.CHANGE_FHIR_SERVER,
          url: this.state.fhirServer
        });
        dfd = $.Deferred();
        this.displayPatientModal();
      } else {
        this.setState({
          showFhirServerEntryError: true,
          fhirAlertMessage: 'Cannot read from this FHIR server. See console for more details.'
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

  handleFhirServerChange: function(event) {
    this.setState({
      fhirServer: event.target.value.toString().trim()
    });
  },

  displayPatientModal: function() {
    this.setState({
      showPatientModal: true,
      patientId: AppStore.getState().getIn(["fhirServer", "context", "patient"]),
      selectedPatient: AppStore.getState().getIn(["fhirServer", "context", "patient"]),
    });
  },

  displayFhirModal: function() {
    this.setState({
      showFhirModal: true,
      fhirServer: ''
    });
  },

  hidePatientModal: function() {
    this.setState({
      showPatientModal: false,
      showPatientEntryError: false
    });
  },

  hideFhirModal: function() {
    this.setState({
      showFhirModal: false,
      showFhirServerEntryError: false
    });
  },

  resetFhirServer: function() {
    this.hideFhirModal();
    this.setState({
      fhirServer: 'https://api.hspconsortium.org/cdshooksdstu2/open'
    });
    AppDispatcher.dispatch({
      type: ActionTypes.CHANGE_FHIR_SERVER,
      url: 'https://api.hspconsortium.org/cdshooksdstu2/open'
    });
    this.displayPatientModal();
  },

  patientSelected: function(patientId) {
    this.setState({
      patientId: patientId,
      selectedPatient: patientId
    });
  },

  toggleCardRenderTemplate() {
    this.setState({
      isMainHooksView: !this.state.isMainHooksView,
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
        <ListGroupItem header='Baby Bili'
                       onClick={this.patientSelected.bind(this, 'BILIBABY')}
                       active={this.state.patientId === 'BILIBABY'}>Male | DOB: 2016-01-04</ListGroupItem>
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
          <div className={this.isHSPCSandbox() ? '' : 'hidden'}>
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

    var fhirModalAlert = this.state.showFhirServerEntryError ?
      (<Alert bsStyle="danger">
        <i className="glyphicon glyphicon-exclamation-sign" />
        <strong> Error: </strong>
        {this.state.fhirAlertMessage}
      </Alert>) : '';

    var fhirModal =(
      <Modal show={this.state.showFhirModal} onHide={this.hideFhirModal}>
        <Modal.Header closeButton>
          <Modal.Title>Change FHIR Server</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {fhirModalAlert}
          <div>
            <b>Current FHIR Server</b><br />
            <p>{this.state.all.getIn(["fhirServer", "context", "baseUrl"])}</p>
          </div>
          <div className="input-container">
            <label>Enter FHIR Server URL:</label>
            <input className="form-control"
                   autoFocus={true}
                   placeholder={this.state.all.getIn(["fhirServer", "context", "baseUrl"])}
                   type="text"
                   onChange={this.handleFhirServerChange}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button className='left-aligned-modal-button' bsStyle="link" onClick={this.resetFhirServer}>Reset to default FHIR server</Button>
          <Button bsStyle="primary" onClick={this.changeFhirServer}>Next</Button>
          <Button onClick={this.hideFhirModal}>Close</Button>
        </Modal.Footer>
      </Modal>);

    var fhirServerChangeButtonClass = CDS_SMART_OBJ.hasOwnProperty('smartObj') ? 'hidden' : 'nav-button change-patient';

    var hookAndPatientOptions = (
      <div className="header-nav">
        <a className={ptClass} onClick={e=>this.setActivity("patient-view")}>Patient View</a>
        <a className={rxClass} onClick={e=>this.setActivity("medication-prescribe")}>Rx View</a>
        <a className="nav-button change-patient" onClick={this.displayPatientModal}>Change Patient</a>
        {patientModal}
        <a className={fhirServerChangeButtonClass} onClick={this.displayFhirModal}>Change FHIR Server</a>
        {fhirModal}
      </div>
    );

    return (
      <div id="react-content">
        <div id="top-bar" className="app-header">
          <span className="header-brand"><i className="glyphicon glyphicon-flash" /> <span className="brand-cds">CDS Hooks</span> Sandbox</span>
          {this.state.isMainHooksView ? hookAndPatientOptions : ''}
        </div>

        <HookEditor hooks={this.state.all.getIn(['hooks', 'hooks'])}
                    editing={this.state.all.getIn(['hooks', 'editing'])}
                    isMainHooksView={this.state.isMainHooksView}
                    toggleCardRenderTemplate={this.toggleCardRenderTemplate} />

        {/*Main Hooks View*/}
        {
          this.state.isMainHooksView && hook === 'medication-prescribe'
          && <RxActivity toggleConsoleLog={this.setConsoleLogSetting}
                         toggleServiceView={this.setServiceContextViewSetting}
                         isConsoleLogEnabled={this.state.consoleLogSettingEnabled}
                         isServiceViewEnabled={this.state.serviceContextViewEnabled}
                         all={this.state.all}/>
        }
        {
          this.state.isMainHooksView && hook === 'patient-view'
          && <PatientViewActivity toggleConsoleLog={this.setConsoleLogSetting}
                                  toggleServiceView={this.setServiceContextViewSetting}
                                  isConsoleLogEnabled={this.state.consoleLogSettingEnabled}
                                  isServiceViewEnabled={this.state.serviceContextViewEnabled}
                                  all={this.state.all}/>
        }

        {/*Card Render View*/}
        {
          !this.state.isMainHooksView && <CardRenderActivity decisions={this.state.all.get('decisions')}
                                                             context={this.state.all.getIn(['fhirServer', 'context'])} />
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
