var restify = require('restify');
var pediatric = require('./pediatric');
var prices = require('./prices');
var patient = require('./patient');
var context = require('./context');

var services = {
  'pediatric-dose-check': pediatric,
  'cms-price-check': prices,
  'pt-hello-world': patient
};

var server = restify.createServer({
  name: 'mock-cds-backend',
  version: '0.0.1'
});


server.use(restify.bodyParser());
server.use(function(req, res, next){
  if (req.method !== 'GET' && req._contentType.match('json\\+fhir')){
    req.body = JSON.parse(req.body.toString())
  }
  res.fhirJson = function(data){
    res.setHeader('Content-Type', 'application/json+fhir');
    res.writeHead(200);
    res.end(JSON.stringify(data))
  }
  next()
})

server.use(restify.CORS());
server.on('uncaughtException', function (request, response, route, error) {
  console.log("Err on", route, error)
  response.send(error)
});

Object.keys(services).forEach(function(name){
  var service = services[name];

  console.log("Configure", name)
  server.get('/' + name + '/metadata', function(req, res, next){
    console.log("Get metadata")
    res.fhirJson(service.metadata)
  });

  server.post(new RegExp("\\/" + name + "\\/\\$cds-hook"), function(req, res, next){
    console.log("Do CDS", name)
    service.service(req.body, function(err, cdsResult){
      console.log("service got", err, cdsResult)
      res.fhirJson(cdsResult);
      if (err){
        err = new restify.errors.InternalServerError('Request failed with ' + e);
        console.log("Err", err)
      }
      console.log("now return", name)
      return next(err);
    });
  });
});

server.get('/service/:serviceName/:reason/:activityInstance', function(req, res, next){
  console.log("View on", req.params.serviceName);
  services[req.params.serviceName].view(req.params.reason, req.params.activityInstance, req, res, next);
})

server.listen(process.env.PORT || 8081, function () {
  console.log('%s listening at %s', server.name, server.url);
  context(server);
});
