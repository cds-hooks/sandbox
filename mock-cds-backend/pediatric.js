var isArray = require('util').isArray;

module.exports = function(indata, cb){
  cb(null, recommend(indata));
}

function getIn(data, path){
  if (!isArray(path)){
    return getIn(data, [path]);
  }

  if (path.length === 0){
    return data;
  }

  return (data.parameter || data.part)
    .filter(function(p){return p.name === path[0];})
    .map(function(p){
	return getIn(p, path.slice(1));
	})

}

function recommend(data) {
  var lowerDose = getIn(data, 'content')[0]["resource"];

  return {
    "resourceType": "Parameters",
      "parameter": [
      {
	"name": "result",
	"part": [{
	  "name": "summary",
	  "valueString": "Suggested does is unusually high (>99.9th percentile)",
	}, {
	  "name": "alternative",
	  "part": [{
	    "name": "label",
	    "valueString": "5 mg daily" 
	  },{
	    "name": "suggestion",
	    "resource": lowerDose
	  }]  
	}, {
	  "name": "alternative",
	  "part": [{
	    "name": "label",
	    "valueString": "10 mg daily" 
	  },{
	    "name": "suggestion",
	    "resource": lowerDose
	  }]  
	}, {
	  "name": "link",
	  "part": [{
	    "name": "label",
	    "valueString": "View prescribing data" 
	  },{
	    "name": "url",
	    "resource": "https://www.cms.gov/Newsroom/MediaReleaseDatabase/Fact-sheets/2015-Fact-sheets-items/2015-04-30.html"
	  }]  
	}]
      }
    ]
  }
}

