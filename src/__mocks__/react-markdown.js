const React = require('react');

function ReactMarkdown({ children }) {
  return React.createElement('div', null, children);
}

module.exports = ReactMarkdown;
module.exports.default = ReactMarkdown;
