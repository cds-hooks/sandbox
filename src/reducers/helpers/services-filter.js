import pickBy from 'lodash/pickBy';
import store from '../../store/store';

/**
 * Get an Object of service IDs and their definitions back that correlate to the hook passed in
 * @param {*} hook - Hook to filter services by
 * @param {*} services - Services configured on the app to filter
 */
export function getServicesByHook(hook, services) {
  function filterByHook(service) {
    return service.hook === hook && service.enabled;
  }
  return pickBy(services, filterByHook);
}


/**
 * Create one cards array that holds all card responses from the passed in service URLs
 * @param {*} serviceUrls - Services to retrieve valid cards from
 */
export function getCardsFromServices(serviceUrls) {
  const totalCards = { cards: [] };
  const { exchanges } = store.getState().serviceExchangeState;
  serviceUrls.forEach((url) => {
    // Check if there is a service exchange (request and response) for this service ID url
    if (exchanges[url]) {
      const { response } = exchanges[url];
      // Check if the service response for cards is valid and has at least one card
      if (response && Object.keys(response) && response.cards && response.cards.length) {
        response.cards.forEach((card) => {
          // Adding a serviceUrl property to each card to distinguish which card maps to which CDS Service (for suggestions analytics endpoint)
          totalCards.cards.push(Object.assign({}, card, {
            serviceUrl: url,
          }));
        });
      }
    }
  });
  return totalCards;
}

/**
 * Filter all valid condition resource entries under the current patient to find the resource
 * that matches that of the coding code
 * @param {*} code - Condition coding code to filter the patient conditions by
 */
export function getConditionCodingFromCode(code) {
  const conditions = Object.assign([], store.getState().patientState.currentPatient.conditionsResources);
  const filteredConditions = conditions.filter(condition => (
    condition.resource.code.coding[0].code === code
  ));
  if (filteredConditions.length) {
    return filteredConditions[0];
  }
  return null;
}
