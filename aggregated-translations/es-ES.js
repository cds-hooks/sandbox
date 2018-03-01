import { addLocaleData } from 'react-intl';
import localeData from 'react-intl/locale-data/es';

addLocaleData(localeData);

const messages = {
  "Terra.ajax.error": "This content failed to load.",
  "Terra.Overlay.loading": "Loading..."
};
const areTranslationsLoaded = true;
const locale = 'es-ES';
export {
  areTranslationsLoaded,
  locale,
  messages
};