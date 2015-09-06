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
    var updates = {};
    if (nextProps.value != this.props.value) {
      updates.input =  moment(nextProps.value).format("YYYY-MM-DD")
      if (this.refs.input.getDOMNode() !== document.activeElement) {
        updates.picking= false;
      }
      this.setState(updates);
    }
  },

  render() {
    var codeBlockStyle = { "fontFamily": "monospace", "backgroundColor": "#D0D0D0" };
    var selectedDay = moment(this.props.value).toDate();

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
    if (this.state.valid || this.state.done) {
      this.setState({picking: false});
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
    this.setState({
      done: false,
      picking: true,
      valid: false
    });
    if (this.refs.daypicker)
    this.refs.daypicker.showMonth(this.props.value);
  },

  inputKey: function(e){
    e.persist();
     if (e.key === "Enter"){
       this.setState({
        done: true,
        picking: !this.state.picking
       });
    }
  },


  handleInputChange(e) {

    var { value } = e.target;
    this.setState({
      input: value,
      picking: true
    });

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
