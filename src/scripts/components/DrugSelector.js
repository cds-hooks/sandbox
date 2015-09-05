import React from 'react';
import AppDispatcher from '../dispatcher/AppDispatcher';
import ActionTypes from '../actions/ActionTypes'
import DrugStore from '../stores/DrugStore'


const DrugSelector = React.createClass({

  componentWillReceiveProps(nextProps){
    if (nextProps.step != this.props.step) {
      this.state.elt = 0;
      this.setState(this.state);
    }
    if (nextProps.step === "done") {
      this.state.q = "";
    }

  },

  getInitialState() {
    return {
      elt: 0,
      q: ""
    };
  },

  sendSearch: function(e){
    this.state.q = e.target.value;
    this.state.elt = 0;
    this.setState(this.state);
    if (this.state.q !== "") {

      AppDispatcher.dispatch({
        type: ActionTypes.SEARCH_DRUGS,
        q: e.target.value
      })
    }
  },

  pickList: function(){
    if (this.props.step && this.props.step !== "done" && this.props.step !== "begin")
      return this.props.options[this.props.step];
    return [];
  },

  pick: function(subtype, decision){
    console.log("pick",subtype, decision);
    AppDispatcher.dispatch({
      type: ActionTypes.PICK_DRUG,
      subtype: subtype,
      decision: decision
    })
  },
  inputKey: function(e){
    e.persist();
    var options = this.pickList();
    if (e.key === "Backspace" && this.props.step !== "begin"){
      AppDispatcher.dispatch({
        type: ActionTypes.PREVIOUS_STEP
      });
      if (this.props.step !== "ingredient") {
        e.preventDefault();
      }
    }
    if (e.key === "Enter" || e.key === "ArrowRight"){
      this.pick(this.props.step, options[this.state.elt])
      e.preventDefault();
    }
    if (e.key === "ArrowDown"){
      e.preventDefault();
      if(this.state.elt < options.length-1) {
        this.state.elt++;
        this.setState(this.state);
      }
    }
    if (e.key === "ArrowUp"){
      e.preventDefault();
      if(this.state.elt > 0) {
        this.state.elt--;
        this.setState(this.state);
      }
    }
  },

  render() {
    var eltNum = this.state.elt;
    var pickList = this
    .pickList()
    .map((h, i)=>{
      var chevron = (i == eltNum)? "chevron" : "";
      return (<tr className={chevron}
              onClick={e=>this.pick(this.props.step, h)} >
              <td className="drug">{h.str}</td>
              <td className="cui">{h.cui}</td>
              </tr>)
    });
    var err = "";
    if (this.state.q.length >2 && pickList.length === 0) {
      err = "No matches";
    }
    var done = "";
    if (this.props.step === "done")
      done = (<h4>{this.props.decisions.prescribable.str}</h4>);
    return (
      <div>
      <h3>Medication</h3>
      <input
      autofocus={true}
      placeholder="search for a drug"
      ref="q"
      type="text"
      onKeyDown={this.inputKey}
      value={this.state.q}
      onChange={this.sendSearch}
      onFocus={this.sendSearch}
      />
      <h4>{this.props.ingredient && this.props.ingredient.str}</h4>
      {err}
      <table className="drug-choice">
      {pickList}
      </table>
      {done}
      </div>
    );
  }

});

module.exports = DrugSelector;
