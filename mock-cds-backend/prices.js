var isArray = require('util').isArray
var priceTable = require('./rxnorm-prices')
var utils = require('./utils')
var metadata = require('./utils').metadata


module.exports = {
  service: function(indata, cb) {
  cb(null, recommend(indata));
  },

  description: {
    name: "CMS Pricing Service", // Remove on complete transition to CDS Hooks 1.0 Spec
    title: "CMS Pricing Service",
    id: "cms-price-check",
    description: "Estimate the price of a prescription based on historical pharmacy dispensing data",
    hook: "medication-prescribe"
  }
}

// recommending means returning a set of "card"s, each with a summary, set of suggestions and a set of links.
// recommending can, alternatively, return a single "decision" indicating a user-approved choice.

function recommend(data) {
  var lowerPrice = data.context[0]
  if (!lowerPrice.medicationCodeableConcept) {
    return {}
  }

  var generic, brand;
  var code = lowerPrice.medicationCodeableConcept.coding[0].code;
  if (priceTable.brandToGeneric[code]) {
    brand = code;
    generic = priceTable.brandToGeneric[code];
  } else {
    generic = code;
  }

  var prices = priceTable.ingredientsToPrices[priceTable.genericToIngredients[generic]];
  if (!prices) {
    return {}
  }

  if (!brand) {
    if (prices.generic) {
      return message("Cost: $" + Math.round(prices.generic.total));
    }
    else return {}
  }

  if (prices.generic && prices.brand) {
    lowerPrice.medicationCodeableConcept = {
      "text": priceTable.cuiToName[generic],
      "coding": [{
        "code": generic,
        "system": "http://www.nlm.nih.gov/research/umls/rxnorm",
        "display": priceTable.cuiToName[generic]
      }]
    };
 //" " +  priceTable.cuiToName[generic]
    return message("Cost: $" + Math.round(prices.brand.total)+". Save $" + Math.round(prices.brand.total - prices.generic.total) + " with a generic."
                  , "change to generic", lowerPrice)
  }

  if (prices.brand) {
    return message("Cost: $" + Math.round(prices.brand.total));
  }
}

function message(summary, label, toPropose) {
  return {
    cards: [{
      summary: summary,
      source: {
        label: "CMS Public Use Files",
      },
      indicator: "info",
      suggestions: label ? [{
        label: label,
        uuid: "123",
        actions: [
          {
            type: 'create',
            resource: toPropose
          }
        ]
      }] : []
    }]
  };
}

