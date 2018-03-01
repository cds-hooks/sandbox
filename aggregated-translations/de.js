import { addLocaleData } from 'react-intl';
import localeData from 'react-intl/locale-data/de';

addLocaleData(localeData);

const messages = {
  "Terra.ajax.error": "Inhalt konnte nicht geladen werden.",
  "Terra.Overlay.loading": "Ladevorgang..."
};
const areTranslationsLoaded = true;
const locale = 'de';
export {
  areTranslationsLoaded,
  locale,
  messages
};