module.exports = {
  "extends": "airbnb",
  "plugins": [
    "react",
    "jsx-a11y",
  ],
  "globals": {
    "window": true,
    "FHIR": true,
    "document": true,
  },
  "rules": {
    "no-console": 0,
    "max-len": 0,
    "react/prop-types": 0,
    "react/no-array-index-key": 0,
    "import/no-named-as-default": 0,
  }
};
