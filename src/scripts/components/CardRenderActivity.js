import React from 'react';
import CodeMirror from 'react-codemirror';
import ReactMarkdown from 'react-markdown';
import { Button, Panel } from 'react-bootstrap'
import AppDispatcher from '../dispatcher/AppDispatcher'
import ActionTypes from '../actions/ActionTypes'

require('codemirror/mode/javascript/javascript');

const CardRenderActivity = React.createClass({
  getInitialState() {
    try {
      var checkJson = JSON.parse(this.props.decisions.get('tempUserJson'));
      if (checkJson && typeof parsedJSON === 'object') {
        return {
          displayJSONError: false,
        }
      }
    } catch (e) {
      return {
        displayJSONError: true,
      }
    }
    return {
      displayJSONError: false,
    }
  },

  getExampleCard() {
    return {
      "summary": "Example Card",
      "indicator": "info",
      "detail": "Add an XYZ complimentary medication OR switch patient order to ABC. " +
                "See SMART app for more details.",
      "source": {
        "label": "Medicine Library",
        "url": "https://example.com",
        "icon": "https://example.com/img/icon-100px.png"
      },
      "links": [
        {
          "label": "Medication SMART app",
          "url": "https://example.com/launch",
          "type": "smart"
        }
      ],
      "suggestions": [
        {
          "label": "Add Complimentary",
          "uuid": "123",
          "actions": [
            {
              "type": "create",
              "description": "Add XYZ",
              "resource": {}
            },
            {
              "type": "delete",
              "description": "Cancel ABC",
              "resource": "MedicationRequest/ABC"
            }
          ]
        },
        {
          "label": "Change Order",
          "uuid": "456",
          "actions": [
            {
              "type": "modify",
              "description": "Modify dosage of Medication",
              "resource": "MedicationRequest/ABC"
            }
          ]
        }
      ]
    }
  },

  componentDidMount() {
    var exampleCard = JSON.stringify(this.getExampleCard(), null, 2);
    if (!this.props.decisions.get('tempCard') && !this.props.decisions.get('tempUserJson')) {
      this.updateCard(exampleCard);
    }
  },

  renderedCard() {
    function source(s) {
      if (!s || !s.label) return

      return <div className="card-source">
        Source: <a className='fake-link'>{s.label}</a>
      </div>
    }

    var indicators = {
      info: 0,
      warning: 1,
      danger: 2
    };

    var card;

    if (this.props.decisions.get('tempCard')) {
      card = this.props.decisions.get('tempCard')
        .sort((b, a) => indicators[a.indicator] - indicators[b.indicator])
        .filter(c=>c.summary)
        .map(c => {
          var classes = "decision-card alert alert-" + c.indicator;
          if (c.links) {
            c.links.map(l => {
              if ("smart" === l.type) {
                if (l.url.indexOf("?") < 0) l.url += "?"
                else l.url += "&"
                l.url += "fhirServiceUrl=" + this.props.context.get('baseUrl')
                l.url += "&patientId=" + this.props.context.get('patient')
              }
              return l;
            });
          }
          return (
            <div key={c.key} className={classes}>
              <div className="card-top">
                <h5 className="card-summary">{c.summary}</h5>
                {source(c.source)}
                {c.detail && <ReactMarkdown softBreak="br" source={c.detail}/>}
                <div>
                  {c.suggestions.map(l => (
                    <button key={l.key} className="btn btn-wired btn-sm">
                      <span className="glyphicon glyphicon-edit" aria-hidden="true" />
                      {l.label}
                    </button>
                  ))}
                  {c.links.map(l => (
                    <a key={l.key} className="source-link fake-link">
                      <span className="glyphicon glyphicon-link" aria-hidden="true" />
                      {l.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          );
        });
    }
    if (card) {
      return (<div>{card}</div>)
    }
  },

  updateCard(newJson) {
    AppDispatcher.dispatch({
      type: ActionTypes.SAVE_USER_JSON,
      value: newJson
    });
    try {
      var parsedJSON = JSON.parse(newJson);
      if (parsedJSON && typeof parsedJSON === 'object') {
        if (this.state.displayJSONError) {
          this.setState({ displayJSONError: false });
        }
        AppDispatcher.dispatch({
          type: ActionTypes.UPDATE_TEMP_CARD,
          result: parsedJSON
        });
      }
    } catch (e) {
      if (!this.state.displayJSONError) {
        this.setState({
          displayJSONError: true,
          errorText: "Check your JSON syntax"
        });
      }
    }
  },

  resetExample() {
    var exampleCode = JSON.stringify(this.getExampleCard(), null, 2);

    this.updateCard(exampleCode);
    this.cm.codeMirror.setValue(exampleCode);
  },

  render() {
    var options = {
      lineNumbers: true,
      mode: {
        name: "javascript",
        json: true
      },
      lint: true,
      tabSize: 2,
    };

    var exampleCode = JSON.stringify(this.getExampleCard(), null, 2);

    var panelErrorHeaderTitle = <h3>Error</h3>

    var errorPanel = (
      <Panel header={panelErrorHeaderTitle} bsStyle="danger">
        {this.state.errorText}
      </Panel>
    );

    return(
      <div className="app-main">
        <div className='card-render-view-container'>
          <h2>Result</h2>
          <div className='card-render-space'>
            {!this.state.displayJSONError &&
            this.props.decisions.get('tempCard') &&
            this.renderedCard()}
            <div>
              {this.state.displayJSONError ? errorPanel : ''}
            </div>
          </div>
        </div>
        <div className='card-render-json-container'>
          <div className='full-width'>
            <div className='card-render-json-title'><h5>Preview a Card with JSON</h5></div>
            <div className='card-render-json-reset'>
              <Button bsStyle="link" onClick={this.resetExample}>Reset example</Button>
            </div>
          </div>
          <div className='card-render-json-border'>
            <CodeMirror value={this.props.decisions.get('tempUserJson') || exampleCode}
                        ref={el => this.cm = el}
                        onChange={this.updateCard}
                        options={options} />
          </div>
        </div>
      </div>
    )
  }
});

module.exports = CardRenderActivity;
