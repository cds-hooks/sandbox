export default {
    "pediatric-dosing": {
      "id": "pediatric-dosing",
      "url": "http://localhost:8081/pediatric-dose-check",
      "name": "Pediatric Dosage Check",
      "intent": "evaluate-prescription",
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


