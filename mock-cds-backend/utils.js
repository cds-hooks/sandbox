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
    return ps['valueString'] || ps['valueUri'] || ps['resource'];
}

// Pattern is like
//
// {'card': [{'summary': 1, 'suggestion': [{'label': 1, 'alternative': 1}], 'link': [{'label': 1}]}]}
function paramsToJson(ps, pattern){
  return Object.keys(pattern)
  .reduce(function(coll, k){
    var val = getIn(ps, k);
    if (pattern[k] === 0){
      val = val && val.length > 0 ? val[0] : null;
      if (val)
      val = extractValue(val);
    } else if (pattern[k] === 1){
      val = extractValue(val[0]);
    } else if (isArray(pattern[k])){
      if (pattern[k].length === 1)
        val = val.map(function(v){ return paramsToJson(v, pattern[k][0]);});
      else if (pattern[k].length === 0) 
        val = val.map(extractValue)
      else 
        throw "invalid patter " + pattern[k]
    } else if (typeof pattern[k] === 'object') {
      val = paramsToJson(val, pattern[k]);
    }
    coll[k] = val;
    return coll;
  }, {})
}

module.exports.getIn = getIn;
module.exports.paramsToJson = paramsToJson;
