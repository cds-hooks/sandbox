import React from 'react'
import moment from 'moment'

var format = v => JSON.stringify(v, null, 2).split(/\n/)

const FhirView = React.createClass({

  getInitialState(){
    return {
      additions: []
    }
  },

  componentWillReceiveProps(newProps) {
    var oldLines = format(this.props.decisions.get('fhir'))
    var newLines = format(newProps.decisions.get('fhir'))
    this.setState({
      additions: newLines.filter(l => oldLines.indexOf(l) === -1)
    });
  },

  componentDidUpdate() {
    window.setTimeout(() => {
      Object.keys(this.refs).forEach(k => {
        var r = this.refs[k];
        r.getDOMNode().className = "line " + (r.props.addition ? "fade-actual" : "");
      });
    });
  },

  render() {
    var additions = this.state.additions
    var output = format(this.props.decisions.get('fhir')).map((l, i) => (
    <div
      ref={i}
      addition={additions.indexOf(l) !== -1}
      className="line"> {l}
    </div>));

    return (<pre className="FhirView">{ output }</pre>);
  },


});

module.exports = FhirView;
