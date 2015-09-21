export default {../actions/ActionTypes
    "pediatric-dosing": {
      "id": "pediatric-dosing",
      "uri": "http://localhost:8081/pediatric-dosing",
      "name": "Pediatric Dosage Check",
      "activity": ["evaluate-prescription"],
      "preFetchTemplate": {
        "resourceType": "Bundle",
        "type": "transaction",
        "entry": [{
          "request": {
            "method": "GET",
            // Most recent height observation
            "url": "Observation?patient={{Patient.id}}&code=8302-2&_sort:desc=date&_count=1"
          }
        },{
          "request": {
            "method": "GET",
            // Complete med list
            "url": "MedicationOrder?patient={{Patient.id}}"
          }
        },{
          "request": {
            "method": "GET",
            // Current patient demographics
            "url": "Patient/{{Patient.id}}"
          }
        }]
      }
    }
  }


