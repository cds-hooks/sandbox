import React from 'react';
import DrugSelector from './DrugSelector';
import DateBox from './DateBox';
import FhirView from './FhirView';
import DateStore from '../stores/DateStore';
import DrugStore from '../stores/DrugStore';

const App = React.createClass({

  componentDidMount: function() {
    DrugStore.addChangeListener(this._onChange);
    DateStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function() {
    DrugStore.removeChangeListener(this._onChange);
    DateStore.removeChangeListener(this._onChange);
  },

  _onChange: function(){
    //TODO avoid mutation. Immutable.js?
    console.log("Got a change");
    var next = this.getStateFromStores();
    console.log("next state", next);
    this.setState(next);
  },

  getStateFromStores() {
    return {
      dates: DateStore.getDates(),
      drug: DrugStore.getStatus()
    }
  },

  getInitialState() {
    DateStore.setDate("start");
    DateStore.setDate("end");
    return this.getStateFromStores();
  },

  render() {
    return (
      <div>
      <div className="OrderEntry">
      <DrugSelector {...this.state.drug} />
      <h3>Start date</h3>
      <DateBox id="start" value={this.state.dates.start}/>
      <h3>End date</h3>
      <DateBox id="end" value={this.state.dates.end}/>
      </div>
      <FhirView {...this.state} />
      </div>
    )
  }
});

module.exports = App;
