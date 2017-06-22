import React from 'react'
import ReactMarkdown from 'react-markdown';

import AppDispatcher from '../dispatcher/AppDispatcher'
import ActionTypes from '../actions/ActionTypes'
import striptags from 'striptags'

window.addEventListener("message", (e) => {
  AppDispatcher.dispatch({
    type: ActionTypes.EXTERNAL_APP_RETURNED
  })

  e.source.close()
})


var indicators = {
  success: 0,
  info: 1,
  warning: 2,
  danger: 3
}

const Cards = React.createClass({
  componentWillReceiveProps(nextProps) {},
  takeSuggestion(suggestion) {
    console.log("TAke", suggestion);
    AppDispatcher.dispatch({
      type: ActionTypes.TAKE_SUGGESTION,
      suggestion: suggestion
    })
  },

  launchService(e, url) {
    e.preventDefault();
    var popup = window.open(url, '_blank');
  },

  render() {
    function source(s) {
      if (!s || !s.label) return

      return <div className="card-source">
        Source: <a href={s.url || "#"}> {s.label}</a>
        </div>
    }

    var cards = this.props.decisions.get('cards')
    .sort((b, a) => indicators[a.indicator] - indicators[b.indicator])
    .filter(c=>c.summary)
    .map(c => {

      var classes = "decision-card alert alert-" + c.indicator;

      if (c.links) c.links.map(l => {
        if ("smart" === l.type) {
          if (l.url.indexOf("?") < 0) l.url += "?"
          else l.url += "&"
          l.url += "fhirServiceUrl=" + this.props.context.get('baseUrl')
          l.url += "&patientId=" + this.props.context.get('patient')
        }
        return l
      })

      var ret = (
      <div key={c.key} className={classes}>
      <div className="card-top">
        <h5 className="card-summary">{c.summary}</h5>
        {source(c.source)}
        {c.detail && <ReactMarkdown softBreak="br" source={c.detail}/>}
        <div>
        {c.suggestions.map(l => (
      <button key={l.key} onClick={e => this.takeSuggestion(l)} className="btn btn-wired btn-sm">
            <span className="glyphicon glyphicon-edit" aria-hidden="true"></span>
            {l.label}</button>
      ))}
          {c.links.map(l => (
      <a key={l.key} className="source-link" onClick={e => this.launchService(e, l.url)} target="_blank" href={l.url}>
              <span className="glyphicon glyphicon-link" aria-hidden="true"></span>
              {l.label}</a>
      )

    )}
    </div>

    </div>

          </div>
      )

      return ret
      })
      if (this.props.decisions.get('calling') && cards.count() == 0) {
        return (<div>Loading cards...</div>)
      }
      else if (cards.count() == 0) {
        return (<div>No cards</div>)
      }

      return (<div>{cards}</div>)
    },

  });

  module.exports = Cards
