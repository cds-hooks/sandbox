var url = runtime.CDS_HOOKS_URL

export default {
  "drug-interaction-cds-hook": {
    "id": "drug-interaction-cds-hook",
    "url": "https://d1fwjs99ve.execute-api.us-east-1.amazonaws.com/prod/drug-interaction-cds-hook",
    "name": "Drug-Drug Interaction",
    "activity": "medication-prescribe",
    "preFetchTemplate": {
      "resourceType": "Bundle",
      "type": "transaction",
      "entry": [
        {
          "request": {
            "method": "GET",
            "url": "MedicationOrder?patient={{Patient.id}}&status=active"
          }
        }
      ]
    }
  },
  "bmi-cds-hook": {
    "id": "bmi-cds-hook",
    "url": "https://o33vjt5ak2.execute-api.us-east-1.amazonaws.com/prod/bmi-cds-hook",
    "name": "Patient BMI",
    "activity": "patient-view",
    "preFetchTemplate": {
      "resourceType": "Bundle",
      "type": "transaction",
      "entry": [
        {
          "request": {
            "method": "GET",
            "url": "Patient/{{Patient.id}}"
          }
        },
        {
          "request": {
            "method": "GET",
            "url": "Observation?patient={{Patient.id}}&code=8302-2&_count=1"
          }
        },
        {
          "request": {
            "method": "GET",
            "url": "Observation?patient={{Patient.id}}&code=3141-9&_count=1"
          }
        }
      ]
    }
  },
  "pt-healthintersections": {
    "id": "pt-healthintersections",
    "url": "http://fhir-dev.healthintersections.com.au/open/$cds-hook",
    "name": "Patient Hello World",
    "activity": "patient-view",
    "preFetchTemplate": {
      "resourceType": "Bundle",
      "type": "transaction",
      "entry": [{
        "request": {
          "method": "GET",
          "url": "Patient/{{Patient.id}}"
        }
      }]
    }
  },
  "pt-hello-world": {
    "id": "pt-hello-world",
    "url": url + "/pt-hello-world",
    "name": "Patient Hello World",
    "activity": "patient-view",
    "preFetchTemplate": {
      "resourceType": "Bundle",
      "type": "transaction",
      "entry": [{
        "request": {
          "method": "GET",
          "url": "Patient/{{Patient.id}}"
        }
      }]
    }
  },
  "cms-price-check": {
    "id": "cms-price-check",
    "url": url + "/cms-price-check",
    "name": "CMS Price Check",
    "activity": "medication-prescribe"
  },
  "pediatric-dosing": {
    "id": "pediatric-dosing",
    "url": url + "/pediatric-dose-check",
    "name": "Pediatric Dosage Check",
    "activity": "medication-prescribe",
    "preFetchTemplate": {
      "resourceType": "Bundle",
      "type": "transaction",
      "entry": [{
        "request": {
          "method": "GET",
          // Most recent height observation
          "url": "Observation?patient={{Patient.id}}&code=8302-2&_count=1"
        }
      }, {
        "request": {
          "method": "GET",
          // Complete med list
          "url": "MedicationOrder?patient={{Patient.id}}"
        }
      }, {
        "request": {
          "method": "GET",
          // Current patient demographics
          "url": "Patient/{{Patient.id}}"
        }
      }]
    }
  }
}
