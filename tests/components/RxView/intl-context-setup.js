import { IntlProvider, intlShape } from 'react-intl';

const locale = 'en-US';
const intlProvider = new IntlProvider({ locale }, {});
const { intl } = intlProvider.getChildContext();

const shallowContext = { context: { intl } };
const mountContext = { context: { intl }, childContextTypes: { intl: intlShape } };

const intlContexts = { shallowContext, mountContext };

export default intlContexts;
