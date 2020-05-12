/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 8081;
// path to webpack built path
const buildPath = path.join(__dirname, '../../build');

app.use(express.static(buildPath));
app.listen(port, () => console.log(`Project is running at http://localhost:${port}/`));
