import { addLocaleData } from 'react-intl';
import localeData from 'react-intl/locale-data/fr';

addLocaleData(localeData);

const messages = {
  "Terra.ajax.error": "This content failed to load.",
  "Terra.Overlay.loading": "Loading..."
};
const areTranslationsLoaded = true;
const locale = 'fr-FR';
export {
  areTranslationsLoaded,
  locale,
  messages
};