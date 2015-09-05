import React from 'react';
import moment from 'moment';

const FhirView = React.createClass({
  render() {
    var resource = {
      "resourceType": "MedicationOrder"
    }

    resource.dateWritten = moment(new Date());
    resource.startDate = moment(this.props.dates.start).format("YYYY-MM-DD");
    resource.endDate = moment(this.props.dates.end).format("YYYY-MM-DD");
    resource.status = "draft";
    resource.patient = {"reference": "Patient/example"};
    console.log("Drug state", this.props)
    if (this.props.drug && this.props.drug.step === "done") {
      console.log("Done!");
      var med = this.props.drug.decisions.prescribable;
      resource.medicationCodeableConcept = {
        "text": med.str,
        "coding": [{
          "display": med.str,
          "system": "http://www.nlm.nih.gov/research/umls/rxnorm",
          "code": med.cui
        }]
      };
    }
    var value = JSON.stringify(resource, null, 2);

    return (<pre className="FhirView">{ value }</pre>);
  },


});

module.exports = FhirView;
