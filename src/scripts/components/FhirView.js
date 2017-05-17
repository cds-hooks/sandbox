import React from 'react'
import moment from 'moment'
import Immutable from 'immutable'

var format = v => JSON.stringify(v, null, 2).split(/\n/)

const FhirView = React.createClass({

  getInitialState(){
    return {
      additions: [],
      shouldHide: false
    }
  },
  shouldComponentUpdate(nextProps, nextState){
    return nextProps.all.get('decisions').get('fhir') !== this.props.all.get('decisions').get('fhir')
  },
  componentWillReceiveProps(newProps) {
    var oldLines = format(this.props.all.get('decisions').get('fhir'))
    var newLines = format(newProps.all.get('decisions').get('fhir'))
    this.setState({
      additions: newLines.filter(l => oldLines.indexOf(l) === -1)
    });
  },

  componentDidUpdate() {
    window.setTimeout(() => {
      Object.keys(this.refs).forEach(k => {
        var r = this.refs[k];
        r.getDOMNode().className = "line " + (r.props.isAddition ? "fade-actual" : "");
      });
    });
  },

  render() {
    var additions = this.state.additions
    var output = format(this.props.all.getIn(['decisions', 'fhir'])).map((l, i) => (
    <div
      key={i}
      ref={i}
      isAddition={additions.indexOf(l) !== -1}
      className="line"> {l}
    </div>));
    if (this.props.all.getIn(['decisions', 'fhir'])){
      return (
        <div className={this.state.shouldHide ? 'fhir-view' : 'fhir-view fhir-view-visible'}>
          <a className="configure-fhir-view" onClick={this.clickShowHide}>Context</a>
          <pre className={this.state.shouldHide ? 'hidden' : ''}>{output}</pre>

        </div>
      );
    } else {
      return (<div className="fhir-view fhir-view-visible"><pre className="fhir-text"><div className="line">(No CDS Hook <i>context resources</i> required.)</div></pre></div>)
    }
  },

  clickShowHide(){
    var state = this.state
    state.shouldHide = !state.shouldHide
    this.setState(state)
    this.forceUpdate()
  }

});

module.exports = FhirView;
