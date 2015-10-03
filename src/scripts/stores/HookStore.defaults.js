var url = "http://hooks.smarthealthit.org:8081"

if (window.location.href.match(/localhost/)) {
  url = "http://localhost:8081"
}

export default {
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
          "url": "Observation?patient={{Patient.id}}&code=8302-2&_sort:desc=date&_count=1"
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


