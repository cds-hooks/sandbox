import React from 'react';
import AppDispatcher from '../dispatcher/AppDispatcher';
import ActionTypes from '../actions/ActionTypes'

const ProblemSelector = React.createClass({
  pickList: function(props) {
    if (!props.conditions) return;

    var conditions = props.conditions
      .sort((a,b)=> {
            if (a.resource.code.text < b.resource.code.text) return -1;
            if (b.resource.code.text < a.resource.code.text) return 1;
            return 0;
      })
    return conditions.map(c => {
        var code = c.resource.code.coding[0].code;
        return (
          <option
            key={c.resource.code.coding[0].code}
          value={c.resource.code.coding[0].code} >
          {c.resource.code.text}</option>
        )})
  },

  pick: function(e) {
    e.persist()
      AppDispatcher.dispatch({
        type: ActionTypes.PICK_CONDITION,
        selection: e.target.value
      })
  },
  render() {
    var problems = this.pickList(this.props)
    return (
      <div className="problem-holder col-xs-12">
        <label> Treating </label>
        <select  value={this.props.selection} className="form-control"
          onChange={e => this.pick(e)}>
          <option value="">Choose a problem</option>
          {problems}
      </select>
    </div>
      );
  }
});

module.exports = ProblemSelector;
