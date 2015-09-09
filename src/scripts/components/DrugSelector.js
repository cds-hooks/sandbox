import React from 'react';
import AppDispatcher from '../dispatcher/AppDispatcher';
import ActionTypes from '../actions/ActionTypes'
import DrugStore from '../stores/DrugStore'

const DrugSelector = React.createClass({

  sendSearch: function(e){
    AppDispatcher.dispatch({
      type: ActionTypes.SEARCH_DRUGS,
      q: e.target.value
    })
  },

  pickList: function(){
    if (this.props.step && this.props.step !== "done" && this.props.step !== "begin")
      return this.props.options[this.props.step];
    return [];
  },

  pick: function(subtype, decision){
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
      if (this.props.step !== 'ingredient'){ 
        e.preventDefault();
      }
    }
    if (e.key === "Enter" || e.key === "ArrowRight"){
      this.pick(this.props.step, options[this.props.elt])
      e.preventDefault();
    }
    if (e.key === "ArrowDown"){
      e.preventDefault();
      AppDispatcher.dispatch({
        type: ActionTypes.MOVE_DRUG_CURSOR,
        direction: "down"
      })
    }
    if (e.key === "ArrowUp"){
      e.preventDefault();
      AppDispatcher.dispatch({
        type: ActionTypes.MOVE_DRUG_CURSOR,
        direction: "up"
      })
    }
  },

  render() {
    var eltNum = this.props.elt;
    var pickList = this
    .pickList()
    .map((h, i)=>{
      var chevron = (i == eltNum)? "chevron" : "";
      return (<tr className={chevron} key={i}
              onClick={e=>this.pick(this.props.step, h)} >
              <td className="drug">{h.str}</td>
              <td className="cui">{h.cui}</td>
              </tr>)
    });
    var err = "";
    if (this.props.q.length >1 && pickList.length === 0) {
      err = "No matches";
    }
    var done = "";
    if (this.props.step === "done")
      done = (<span className='selected-drug'>{this.props.decisions.prescribable.str}</span>);
    return (
      <div className="Drug-Selector">
  <div className="form-group">
    <label for="exampleInputEmail1">Medication</label>
      <input
      className="form-control"
      autofocus={true}
      placeholder="search for a drug"
      ref="q"
      type="text"
      onKeyDown={this.inputKey}
      value={this.props.q}
      onChange={this.sendSearch}
      />
      <h5>{this.props.ingredient && this.props.ingredient.str || err}</h5>
      <div className="Drug-Selector-holder">
      <table className="drug-choice">
      {pickList}
      </table>
      </div>
      {done}
  </div>
      </div>
    );
  }
});

module.exports = DrugSelector;
