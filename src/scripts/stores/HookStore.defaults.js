var url = runtime.CDS_HOOKS_URL

export default {
  "cms-price-check": {
    "id": "cms-price-check",
    "enabled": true,
    "url": url + "/cds-services/cms-price-check",
    "name": "CMS Price Check",
    "activity": "medication-prescribe"
  }
}
