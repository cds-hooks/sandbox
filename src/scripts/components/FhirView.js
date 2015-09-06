import React from 'react';
import moment from 'moment';

const FhirView = React.createClass({

  lines(props){
    var resource = {
      "resourceType": "MedicationOrder"
    }
    resource.dateWritten = moment(new Date());
    resource.startDate = moment(props.dates.start).format("YYYY-MM-DD");
    resource.endDate = moment(props.dates.end).format("YYYY-MM-DD");
    resource.status = "draft";
    resource.patient = {"reference": "Patient/example"};
    if (props.drug && props.drug.step === "done") {
      var med = props.drug.decisions.prescribable;
      resource.medicationCodeableConcept = {
        "text": med.str,
        "coding": [{
          "display": med.str,
          "system": "http://www.nlm.nih.gov/research/umls/rxnorm",
          "code": med.cui
        }]
      };
    }
    return JSON.stringify(resource, null, 2).split(/\n/);
  },

  componentWillReceiveProps(newProps){
    console.log("Will receive props", newProps);
    var oldLines = this.lines(this.props);
    var newLines = this.lines(newProps);
    var additions = newLines
      .filter(l=>oldLines.indexOf(l) === -1);
    console.log("Additions are", additions, oldLines, newLines);
    this.setState({additions: additions});
  },

  render() {
    var additions = this.state ? this.state.additions : [];
    var output = this.lines(this.props).map(l=>
                  (<div
                   className={additions.indexOf(l) === -1 ? "old-line" : "new-line"}>
                   {l}
                   </div>));

    return (<pre className="FhirView">{ output }</pre>);
  },


});

module.exports = FhirView;
