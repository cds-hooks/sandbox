var url = runtime.CDS_HOOKS_URL + "/cds-services/"

export default {
  [url + "cms-price-check"]: {
    enabled: true,
    id: url + "cms-price-check",
    url: url + "cms-price-check",
    name: "CMS Price Check", // Remove on complete transition to CDS Hooks 1.0 Spec
    title: "CMS Price Check",
    hook: "medication-prescribe"
  },
  [url + "patient-hello-world"]: {
    enabled: true,
    id: url + "patient-hello-world",
    url: url + "patient-hello-world",
    name: "Patient Hello world", // Remove on complete transition to CDS Hooks 1.0 Spec
    title: "Patient Hello world",
    hook: "patient-view",
    prefetch: {
      "patientToGreet": "Patient/{{Patient.id}}"
    }
  }
}
