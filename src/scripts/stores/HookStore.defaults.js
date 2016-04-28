var url = runtime.CDS_HOOKS_URL

export default {
  "cms-price-check": {
    "enabled": true,
    "id": url + "/cds-services/cms-price-check",
    "url": url + "/cds-services/cms-price-check",
    "name": "CMS Price Check",
    "hook": "medication-prescribe"
  }
}
