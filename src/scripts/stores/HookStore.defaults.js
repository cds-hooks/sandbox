var url = runtime.CDS_HOOKS_URL + "/cds-services/"

export default {
  [url + "cms-price-check"]: {
    "enabled": true,
    "id": url + "cms-price-check",
    "url": url + "cms-price-check",
    "name": "CMS Price Check",
    "hook": "medication-prescribe"
  }
}
