var url = runtime.CDS_HOOKS_URL

export default {
  "drug-interaction-cds-hook": {
    "id": "drug-interaction-cds-hook",
    "enabled": false,
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
    "enabled": false,
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
    "enabled": false,
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
    "enabled": true,
    "url": url + "/pt-hello-world/$cds-hook",
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
    "enabled": true,
    "url": url + "/cms-price-check/$cds-hook",
    "name": "CMS Price Check",
    "activity": "medication-prescribe"
  },
  "pediatric-dosing": {
    "id": "pediatric-dosing",
    "enabled": false,
    "url": url + "/pediatric-dose-check/$cds-hook",
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
  },
  "WK-patient-view": {
    "id": "WK-patient-view",
    "enabled": false,
    "url": "http://wkhfhir.azurewebsites.net/api/$cds-hook",
    "name": "WK Patient View",
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
        }
      ]
    }
  },
  "WK-med-prescribe": {
    "id": "WK-med-prescribe",
    "enabled": false,
    "url": "http://wkhfhir.azurewebsites.net/api/$cds-hook",
    "name": "WK Medication Prescribe",
    "activity": "medication-prescribe"
  },
  "pds-patient": {
    "id": "pds-patient",
    "enabled": false,
    "url": "https://staging.rxcheck.com/pds/patient",
    "name": "Prescription Decision Support - Patient",
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
            "url": "MedicationOrder?patient={{Patient.id}}&status=active"
          }
        }
      ]
    }
  },
  "medapptech-pill-images": {
    "id": "medapptech-pill-images",
    "enabled": false,
    "url": "http://cds.medapptech.com/$cds-hook",
    "name": "Pill Images",
    "activity": "medication-prescribe"
  },
  "premier-pt-view": {
    "id": "premier-pt-view",
    "enabled": false,
    "url": "http://premiercdsapp.elasticbeanstalk.com/fhir/$cds-hook",
    "name": "Premier CDS",
    "activity": "patient-view"
  },
  "pds-prescribe": {
    "id": "pds-prescribe",
    "enabled": false,
    "url": "https://staging.rxcheck.com/pds/prescribe",
    "name": "Prescription Decision Support - Prescribe",
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
  "pt-eligibility-benefits": {
    "id": "pt-eligibility-benefits",
    "enabled": false,
    "url": "http://52.70.147.29/eligibility-benefits/$cds-hook",
    "name": "Patient Eligibility",
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
        }
      ]
    }
  },
  "mo-glif-cds-hook-rx-prescribe": {
    "id": "mo-glif-cds-hook-rx-prescribe",
    "enabled": false,
    "url": "https://fhir-cthon-11-demo-direct.test.medical-objects.com.au/rest/fhir/$cds-hook",
    "name": "MO GLIF CDS Hook for medication-prescribe",
    "activity": "medication-prescribe",
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
            "url": "Observation?patient={{Patient.id}}&_sort:desc=date"
          }
        },
        {
          "request": {
            "method": "GET",
            "url": "DiagnosticReport?patient={{Patient.id}}"
          }
        },
        {
          "request": {
            "method": "GET",
            "url": "MedicationOrder?patient={{Patient.id}}"
          }
        }
      ]
    }
  },
  "meducation-view": {
    "id": "meducation-view",
    "enabled": false,
    "url": "https://hooks.meducation.com",
    "name": "Meducation View",
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
  "bilirubin-patient-view": {
    "id": "bilirubin-patient-view",
    "enabled": false,
    "url": "https://sandbox.hspconsortium.org/hspc-bilirubin-cdshooksadapter/patient-view/$cds-hook",
    "name": "Bilirubin Patient View CDS Hooks Patient",
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
        }
      ]
    }
  }
}
