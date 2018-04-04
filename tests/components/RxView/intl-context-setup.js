import { IntlProvider, intlShape } from 'react-intl';
import messages from '../../../aggregated-translations/en-US.js';

const locale = 'en-US';
const intlProvider = new IntlProvider({ locale, messages }, {});
const { intl } = intlProvider.getChildContext();

const shallowContext = { context: { intl } };
const mountContext = { context: { intl }, childContextTypes: { intl: intlShape } };

const intlContexts = { shallowContext, mountContext };

export default intlContexts;
