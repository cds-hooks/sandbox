import React from 'react'
import AppDispatcher from '../dispatcher/AppDispatcher'
import ActionTypes from '../actions/ActionTypes'
import striptags from 'striptags'

const Cards = React.createClass({
  componentWillReceiveProps(nextProps) {},

  render() {
    console.log(this.props.decisions.get('cards').map(c=>c))
    console.log(this.props.decisions.get('cards').map(c=>c).toJS().length)
    var cards = this.props.decisions.get('cards').map(c=>(

      <div className="decision-card">
        <div className="card-summary">{c.summary}</div>
        {c.suggestion.map(l=>(
          <button className="btn btn-success">{l.label}</button>
        ))}
        {c.link.map(l=>(
          <a target="_blank" href={l.url}>{l.label}</a>
        ))}
      </div>
    ))
    if (cards.count() == 0) {
      return null;
    }
    console.log("Dealt", cards)
    return (<div>{cards}</div>)
  },

});

module.exports = Cards
