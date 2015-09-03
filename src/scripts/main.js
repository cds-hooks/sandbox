require('bootstrap-webpack');
require('react-tap-event-plugin')();
require('!style!css!sass!../assets/stylesheets/style.scss');

// TODO: Require assets here.
// require('../assets/images/product.png');

import App from './components/App.js';
import React from 'react';

React.render(<App josh="here"/>, document.getElementById('main'));
