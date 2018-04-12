import pickBy from 'lodash/pickBy';
import store from '../../store/store';

/**
 * Get an Object of service IDs and their definitions back that correlate to the hook passed in
 * @param {*} hook - Hook to filter services by
 * @param {*} services - Services configured on the app to filter
 */
export function getServicesByHook(hook, services) {
  function filterByHook(service) {
    return service.hook === hook;
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
          totalCards.cards.push(card);
        });
      }
    }
  });
  return totalCards;
}
