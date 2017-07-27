import React from 'react';
import AppDispatcher from '../dispatcher/AppDispatcher';
import ActionTypes from '../actions/ActionTypes';
import DrugSelector from './DrugSelector';
import ProblemSelector from './ProblemSelector';
import DateBox from './DateBox';
import FhirView from './FhirView';
import Cards from './Cards';

const PatientViewActivity = React.createClass({

  render() {
    var patient = this.props.all.getIn(['fhirServer', 'patient'])
    var name = "name";
    var dob = "dob"
    var pid = "pid"
    if (patient) name = patient.name[0].given.join(" ") + " " + patient.name[0].family.join(" ")
    if (patient) pid = patient.id
    if (patient) dob = patient.birthDate

    var containerName = this.props.isServiceViewEnabled ? 'order-entry patient-view mock-ehr-view half-view' : 'order-entry patient-view mock-ehr-view';

    return <div id="main" className="app-main">
      <div className={containerName}>
        <h1 className="view-title">Patient View</h1>
        <h2>{name}</h2>
        <p><strong>ID: </strong> {pid} <strong>Birthdate: </strong> {dob}</p>
        <div className="decision-spacer"></div>
        <Cards className="card-holder" decisions={this.props.all.get('decisions')} context={this.props.all.getIn(['fhirServer', 'context'])} />
      </div>
      <FhirView {...this.props} hook='patient-view' />
    </div>

  }
});

module.exports = PatientViewActivity;
