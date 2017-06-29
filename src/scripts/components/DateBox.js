import React from 'react';
import ReactDOM from 'react-dom';
import DayPicker from 'react-day-picker';
import AppDispatcher from '../dispatcher/AppDispatcher';
import ActionTypes from '../actions/ActionTypes';
import moment from 'moment';
var { isPastDay, isSameDay } =  DayPicker.DateUtils;

const DateBox = React.createClass({
  getInitialState() {
    return {
      input: moment(this.props.value).format("YYYY-MM-DD")
    };
  },

  bodyClick(e) {
      if (!ReactDOM.findDOMNode(e.target)){
        AppDispatcher.dispatch({
          type: ActionTypes.SELECT_DATE,
          id: this.props.id,
          decision: this.props.value
        })
      }
  },

  componentDidMount(){
    window.bodyClicks.on('click', this.bodyClick)
  },

  componentWillUnmount(){
    window.bodyClicks.removeListener('click', this.bodyClick)
  },

  componentWillReceiveProps(nextProps){
    var updates = {};
    if (nextProps.value != this.props.value) {
      updates.input =  moment(nextProps.value).format("YYYY-MM-DD")
      this.setState(updates);
    }
  },

  render() {
    var codeBlockStyle = { "fontFamily": "monospace", "backgroundColor": "#D0D0D0" };
    var selectedDay = moment(this.props.value).toDate();
    var modifiers = {
      "disabled": ()=>false,
        "selected": (day) => isSameDay(selectedDay, day)
    };
    var picker = <DayPicker
    ref="daypicker"
    enableOutsideDays={true}
    initialMonth={ this.props.value }
    numberOfMonths={ 1 }
    modifiers={ modifiers }
    onDayClick={ this.handleDayTouchTap } />;

    if (!this.props.picking) {
      picker = null;
    }

    var control = ( <div className="DateBox">
       <input
       ref="input"
       type="text"
       className="DateText form-control"
       value={ this.state.input }
       placeholder="YYYY-MM-DD"
       onChange={ this.handleInputChange }
       onFocus={ this.startPicking }
       onMouseUp={ this.startPicking }
       onKeyDown={this.startPicking} />
       {picker}
       </div> );

    return (
      <div className="date-container">
        <label>{this.props.display}</label>
        <input type="checkbox" checked={this.props.enabled} onChange={this.toggleEnabled}/>
        {this.props.enabled && control}
      </div>);
  },

  toggleEnabled(){
    AppDispatcher.dispatch({
      type: ActionTypes.TOGGLE_DATE_ENABLED,
      id: this.props.id,
      enabled: !this.props.enabled
    })
  },

  handleDayTouchTap(e, day, modifiers) {
    AppDispatcher.dispatch({
      type: ActionTypes.SELECT_DATE,
      id: this.props.id,
      decision: day
    })
  },

  startPicking(e) {
    if (e && e.key === "Tab") {
      return;
    }
    AppDispatcher.dispatch({
      type: ActionTypes.OFFER_DATES,
      id: this.props.id
    })
  },

  handleInputChange(e) {
    var { value } = e.target;
    this.setState({
      input: value,
    });
    if (moment(value, "YYYY-MM-DD", true).isValid()) {
      var decision = moment(value, "YYYY-MM-DD").toDate();
      if (value !== moment(this.props.value).format("YYYY-MM-DD")) {
        AppDispatcher.dispatch({
          type: ActionTypes.SELECT_DATE,
          id: this.props.id,
          decision: decision
        })
      }
    }
  }

});

module.exports = DateBox;
