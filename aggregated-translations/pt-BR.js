import { addLocaleData } from 'react-intl';
import localeData from 'react-intl/locale-data/pt';

addLocaleData(localeData);

const messages = {
  "Terra.ajax.error": "This content failed to load.",
  "Terra.Overlay.loading": "Loading..."
};
const areTranslationsLoaded = true;
const locale = 'pt-BR';
export {
  areTranslationsLoaded,
  locale,
  messages
};