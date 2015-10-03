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
    if (patient) name = patient.name[0].given.join(" " ) + patient.name[0].family.join(" " )
    if (patient) dob = patient.birthDate
    return <div id="main">
      <div className="OrderEntry PatientView container">
        <div className="row">
          <h4>{name}</h4>
          <b>Birthdate: </b> {dob}
        </div>
        <div className="decision-spacer"></div>
        <Cards className="card-holder" decisions={this.props.all.get('decisions')} />
      </div>
      <FhirView {...this.props} />
    </div>

  }
});

module.exports = PatientViewActivity;
