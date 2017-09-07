import $ from 'jquery';
window.CDS_SMART_OBJ = window.CDS_SMART_OBJ || {};

((() => {
  var ret = $.Deferred();
  const CDS_SMART_OBJ = {};

  const onReady = (smart) => {
    if (smart.hasOwnProperty('tokenResponse')) {
      CDS_SMART_OBJ.smartObj = smart;
      CDS_SMART_OBJ.accessToken = smart.tokenResponse;
      if (smart.hasOwnProperty('server') &&
        smart.server.hasOwnProperty('serviceUrl')) {
        CDS_SMART_OBJ.fhirBaseUrl = smart.server.serviceUrl;
      }
      return ret.resolve(smart.tokenResponse);
    } else {
      CDS_SMART_OBJ.onError();
    }
  };
  CDS_SMART_OBJ.onReady = onReady;

  const onError = () => {
    console.log("No access token received for this session");
    return ret.reject();
  };
  CDS_SMART_OBJ.onError = onError;

  const fetchContext = () => {
    FHIR.oauth2.ready(CDS_SMART_OBJ.onReady, CDS_SMART_OBJ.onError);
    return ret.promise();
  };
  CDS_SMART_OBJ.fetchContext = fetchContext;

  window.CDS_SMART_OBJ = CDS_SMART_OBJ;
}))(this);

export default window.CDS_SMART_OBJ;
