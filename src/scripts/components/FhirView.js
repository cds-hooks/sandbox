import React from 'react'
import moment from 'moment'
import Immutable from 'immutable'

var format = v => JSON.stringify(v, null, 2).split(/\n/)

const FhirView = React.createClass({

  getInitialState(){
    return {
      additions: []
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
      return (<pre className="FhirView">{ output }</pre>);
    } else {
      return (<pre className="FhirView"><div className="line">(No CDS Hook <i>context resources</i> required.)</div></pre>)
    }
  }


});

module.exports = FhirView;
