import React from 'react';
import DayPicker from 'react-day-picker';
import moment from 'moment';
import AppDispatcher from '../dispatcher/AppDispatcher';
import ActionTypes from '../actions/ActionTypes'
import DrugStore from '../stores/DrugStore'

var { isPastDay, isSameDay } = require("../../../node_modules/react-day-picker/lib/Utils.js");

const DrugSelector = React.createClass({


  componentDidMount: function() {
    DrugStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function() {
    DrugStore.removeChangeListener(this._onChange);
  },

  getInitialState() {
    var today = new Date();
    return {
      hits: [],
      q: "",
      // The value of the input field
      value: moment(today).format("YYYY-MM-DD"),
      // The month to display in the calendar
      month: today
    };
  },

  _onChange: function(){
    //TODO avoid mutation. Immutable.js?
    this.state.hits = DrugStore.getHits();
    this.setState(this.state);
  },
  sendSearch: function(e){
    this.state.q = e.target.value;
    this.setState(this.state);
    AppDispatcher.dispatch({
      type: ActionTypes.SEARCH_DRUGS,
      q: e.target.value
    })
  },

  render() {
    var codeBlockStyle = { "fontFamily": "monospace",
      "backgroundColor": "#D0D0D0" };
    var { value, month } = this.state;
    var selectedDay = moment(value, "YYYY-MM-DD", true).toDate();

    var modifiers = {

      // Add the `disabled` modifier to days in the past. The day cell will have
      // a `DayPicker-Day--disabled` CSS class
      "disabled": ()=>false,

        // Add the `selected` modifier to days corresponding to the day inserted
        // in the input field. The day cell will have a `DayPicker-Day--selected`
        // CSS class
        "selected": (day) => isSameDay(selectedDay, day)
    };
    return (
      <div>
      <header>
      <h1>Pick a drug!</h1>
      <input
      ref="q"
      type="text"
      value={this.state.q}
      onChange={this.sendSearch}
      />
      <pre>
      {JSON.stringify(this.state.hits, null, 2)}
      </pre>
      {JSON.stringify(this.props, null,2)}
      <p>
      <input
      ref="input"
      type="text"
      value={ value }
      placeholder="YYYY-MM-DD"
      onChange={ this.handleInputChange }
      onFocus={ this.showCurrentDate } />
      </p>
      <DayPicker
      ref="daypicker"
      enableOutsideDays={true}
      initialMonth={ this.state.month }
      numberOfMonths={ 1 }
      modifiers={ modifiers }
      onDayTouchTap={ this.handleDayTouchTap } />
      </header>
      <article className="context">
      <p>
      Greeting form <a href="https://github.com/taiansu/generator-rf">RF generator</a>.
      </p>

      <p>
      Remember you are powered with <a href="https://gaearon.github.io/react-hot-loader/">react-hot-loader</a> now. Edit this file in <span style={ codeBlockStyle }>src/scripts/components/App.js</span> and save it, it will auto reload the page for you.
        </p>
      </article>
      </div>
    );
  },

  handleInputChange(e) {

    var { value } = e.target;
    let { month } = this.state;

    // Change the current month only if the value entered by the user is a valid
    // date according to the `L` format
    if (moment(value, "YYYY-MM-DD", true).isValid()) {
      month = moment(value, "YYYY-MM-DD").toDate();
    }

    this.setState({
      value: value,
      month: month
    }, this.showCurrentDate);
  },
  handleDayTouchTap(e, day, modifiers) {
    this.setState({
      value: moment(day).format("YYYY-MM-DD"),
      month: day
    });
  },

  showCurrentDate() {
    this.refs.daypicker.showMonth(this.state.month);
  }
});

module.exports = DrugSelector;
