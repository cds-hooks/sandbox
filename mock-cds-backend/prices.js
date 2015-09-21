var isArray = require('util').isArray
var getIn = require('./utils').getIn
var priceTable = require('./rxnorm-prices')


module.exports = {
  service: function(indata, cb) {
  cb(null, recommend(indata));
  }
}

// recommending means returning a set of "card"s, each with a summary, set of suggestions and a set of links.
// recommending can, alternatively, return a single "decision" indicating a user-approved choice.

function recommend(data) {
  var lowerPrice = getIn(data, 'context')[0]["resource"];
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
  var ret = {
    "resourceType": "Parameters",
    "parameter": [{
      "name": "card",
      "part": [{
        "name": "summary",
        "valueString": summary,
      },{
        "name": "source",
        "valueString": "CMS Public Use Files",
      },{
        "name": "indicator",
        "valueString": "info",
      }]
    }]
  };
  if (label) {
    ret.parameter[0].part.push({
      "name": "suggestion",
      "part": [{
        "name": "label",
        "valueString": label
      }, {
        "name": "create",
        "resource": toPropose
      }]
    });
  }
  return ret;
}

