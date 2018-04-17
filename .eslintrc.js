module.exports = {
  "extends": "airbnb",
  "plugins": [
    "react",
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
    "react/no-did-mount-set-state": 0,
    "react/require-default-props": 0,
    "class-methods-use-this": 0,
    "curly": [2, "all"],
  }
};
