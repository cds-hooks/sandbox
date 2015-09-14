import React from 'react'
import AppDispatcher from '../dispatcher/AppDispatcher'
import ActionTypes from '../actions/ActionTypes'
import striptags from 'striptags'

const Cards = React.createClass({
  componentWillReceiveProps(nextProps) {},
  takeSuggestion(suggestion){
    AppDispatcher.dispatch({
      type: ActionTypes.TAKE_SUGGESTION,
      suggestion: suggestion
    })
  },

  render() {
    var cards = this.props.decisions.get('cards').map(c=>(

      <div key={c.key} className="decision-card">
        <div className="card-summary">{c.summary}</div>
        {c.suggestion.map(l=>(
          <button key={l.key} onClick={e=>this.takeSuggestion(l)} className="btn btn-success btn-xs">
          <span className="glyphicon glyphicon-edit" aria-hidden="true"></span>
            {l.label}</button>
        ))}
        {c.link.map(l=>(
          <a key={l.key} target="_blank" href={l.url}>
          <span className="glyphicon glyphicon-link" aria-hidden="true"></span>
            {l.label}</a>
        ))}
      </div>
    ))
    if (cards.count() == 0) {
      return null;
    }
    return (<div>{cards}</div>)
  },

});

module.exports = Cards
