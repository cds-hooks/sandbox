import React from 'react';
import DayPicker from 'react-day-picker';
import AppDispatcher from '../dispatcher/AppDispatcher';
import ActionTypes from '../actions/ActionTypes';
import moment from 'moment';
var { isPastDay, isSameDay } = require("../../../node_modules/react-day-picker/lib/Utils.js");

const DateBox = React.createClass({
  getInitialState() {
    return {
      input: moment(this.props.value).format("YYYY-MM-DD")
    };
  },

  componentWillReceiveProps(nextProps){
    if (nextProps.value != this.props.value) {
      this.state.input = moment(nextProps.value).format("YYYY-MM-DD")
      if (this.refs.input.getDOMNode() !== document.activeElement) {
        this.state.picking = false;
      }
      this.setState(this.state);
    }
  },

  render() {
    console.log("render", this.props, this.state);
    var codeBlockStyle = { "fontFamily": "monospace", "backgroundColor": "#D0D0D0" };
    var selectedDay = moment(this.props.value).toDate();
    console.log(selectedDay);

    var modifiers = {

      // Add the `disabled` modifier to days in the past. The day cell will have
      // a `DayPicker-Day--disabled` CSS class
      "disabled": ()=>false,

        // Add the `selected` modifier to days corresponding to the day inserted
        // in the input field. The day cell will have a `DayPicker-Day--selected`
        // CSS class
        "selected": (day) => isSameDay(selectedDay, day)
    };
    var picker = <DayPicker
      ref="daypicker"
      enableOutsideDays={true}
      initialMonth={ this.props.value }
      numberOfMonths={ 1 }
      modifiers={ modifiers }
      onDayTouchTap={ this.handleDayTouchTap } />;

    if (!this.state.picking) {
      picker = null;
    }

     return (<div className="DateBox">
      <input
      ref="input"
      type="text"
      className="DateText"
      value={ this.state.input }
      placeholder="YYYY-MM-DD"
      onChange={ this.handleInputChange }
      onKeyDown={this.inputKey}
      onFocus={ this.startPicking }
      onBlur={ this.stopPicking }
      />
      {picker}
      </div>
    );
  },

  stopPicking(e){
    console.log("Stop picking", e);
    if (this.state.valid || this.state.done) {
      this.state.picking = false;
      this.setState(this.state);
    }
  },

  handleDayTouchTap(e, day, modifiers) {
    AppDispatcher.dispatch({
      type: ActionTypes.SELECT_DATE,
      id: this.props.id,
      decision: day
    })
  },

  startPicking() {
    this.state.done = false;
    this.state.picking = true;
    this.state.valid = false;
    this.setState(this.state);
    if (this.refs.daypicker)
    this.refs.daypicker.showMonth(this.props.value);
  },

  inputKey: function(e){
    e.persist();
     if (e.key === "Enter"){
       this.state.done = true;
       this.state.picking = !this.state.picking;
       this.setState(this.state);
    }
  },


  handleInputChange(e) {

    var { value } = e.target;
    this.state.input = value;
    this.state.picking = true;
    this.setState(this.state);

    if (moment(value, "YYYY-MM-DD", true).isValid()) {
      var decision = moment(value, "YYYY-MM-DD").toDate();
      this.state.valid = true;
      AppDispatcher.dispatch({
        type: ActionTypes.SELECT_DATE,
        id: this.props.id,
        decision: decision
      })
    }

  }

});

module.exports = DateBox;
