var isArray = require('util').isArray;

function getIn(data, path) {
  if (!isArray(path)) {
    return getIn(data, [path]);
  }

  if (path.length === 0) {
    return data;
  }

  return (data.parameter || data.part)
  .filter(function(p) {
    return p.name === path[0];
  })
  .map(function(p) {
    return getIn(p, path.slice(1));
  })
}

//paramsToJS(someparams, {'card': [{'summary': 1, 'suggestion': [{"label": 1, "valueString":1}], 'link': ["label": 1, "valueUri": 1]}]})


function extractValue(ps){
  var props = ["valueString", "valueUri", "valueId", "valueCode", "valueCoding", "valueInteger", "resource"]
  for (var i=0; i<props.length; i++){
    if (ps[props[i]]) return ps[props[i]]
  }
}

// Pattern is like
//
// {'card': [{'summary': 1, 'suggestion': [{'label': 1, 'alternative': 1}], 'link': [{'label': 1}]}]}
function paramsToJson(ps, pattern){
  return Object.keys(pattern)
  .reduce(function(coll, k){

    var minCardinality = pattern[k][0];
    var maxCardinality = pattern[k][1];
    var subPattern = pattern[k][2];
    var isNested = (typeof subPattern === 'object');
    var val = getIn(ps, k);

    if (!isNested){
      val = val.map(extractValue);
    } else {
      val = val.map(function(v){ return paramsToJson(v, subPattern);});
    }

    if (minCardinality === 1){
      if (val.length < 1) {
        throw "Min cardinality 1 but got no " + k;
      }
    }

    if (maxCardinality === 1) {
      val = val[0]
    }

    coll[k] = val;
    return coll;
  }, {})
}

var test =  paramsToJson({
  "parameter" : [
    {
      "name" : "activityInstance",
      "valueString" : "60abe606-ea4a-4cf1-a6ba-6ddf58183c11"
    },
    {
      "valueString" : "http://localhost:8080/service-done.html",
      "name" : "redirect"
    },
    {
      "valueString" : "medication-prescribe",
      "name" : "activity"
    },
    {
      "resource" : {
        "test": true
      },
      "name" : "context"
    },
    {
      "name" : "preFetchData"
    }
  ],
  "resourceType" : "Parameters"
} , {
  activityInstance:[1, 1, "string"],
  activity:  [1, 1, "string"],
  redirect:  [1, 1, "uri"],
  context:   [0, "*", "resource"],
  preFetchData: [0, 1, "resource"]
});

if (test.activity !== "medication-prescribe" || test.context[0].test !== true) {
  throw "Parsing by schema failed."
}

module.exports.getIn = getIn;
module.exports.paramsToJson = paramsToJson;
