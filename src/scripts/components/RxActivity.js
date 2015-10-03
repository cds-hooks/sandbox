import React from 'react';
import AppDispatcher from '../dispatcher/AppDispatcher';
import ActionTypes from '../actions/ActionTypes';
import DrugSelector from './DrugSelector';
import ProblemSelector from './ProblemSelector';
import DateBox from './DateBox';
import FhirView from './FhirView';
import Cards from './Cards';

const RxActivity = React.createClass({

  render() {
    return <div id="main">
      <div className="OrderEntry container">
        <div className="row">
          <ProblemSelector
            conditions={this.props.all.getIn(['fhirServer', 'conditions'])} 
            selection={this.props.all.getIn(['fhirServer', 'selection'])}
          />
        </div>
        <DrugSelector {...this.props.all.get('drug').toJS()} />
        <div className="row">
          <DateBox id="start" display="Start date" {...this.props.all.get('dates').start} />
          <DateBox id="end" display="End date" {...this.props.all.get('dates').end} />
        </div>
        <div className="decision-spacer"></div>
        <Cards className="card-holder" decisions={this.props.all.get('decisions')} />
      </div>
      <FhirView {...this.props} />
    </div>

  }

});

module.exports = RxActivity;
