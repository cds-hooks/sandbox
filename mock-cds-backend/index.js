var restify = require('restify');
var pediatric = require('./pediatric');
var prices = require('./prices');
var patient = require('./patient');
var context = require('./context');

var services = {
  'pediatric-dose-check': pediatric,
  'cms-price-check': prices,
  'patient-hello-world': patient
};

var server = restify.createServer({
  name: 'mock-cds-backend',
  version: '0.0.1'
});

server.use(restify.bodyParser());
server.use(function(req, res, next){
  if (req.method !== 'GET' && req._contentType.match('json\\+fhir')){
    req.body = req.body ? JSON.parse(req.body.toString()) : {}
  }
  next()
})
restify.CORS.ALLOW_HEADERS.push('authorization');
server.use(restify.CORS());
server.on('uncaughtException', function (request, response, route, error) {
  console.log("Err on", route, error)
  response.end(error.toString())
});

var metas = Object.keys(services).map(function(name){
  return services[name].description
});

server.get('cds-services', function(req, res, next){
  return res.json({
    services: metas
  })
})

Object.keys(services).forEach(function(name){
  var service = services[name];
  server.post("/cds-services/"+name+"/analytics/:uuid", function(req, res, next){
    return res.json({thanks: true});
  });
  server.post("/cds-services/"+name, function(req, res, next){
    console.log("Do CDS", name)
    service.service(req.body, function(err, cdsResult){
      console.log("service got", err, cdsResult)
      res.json(cdsResult);
      if (err){
        err = new restify.errors.InternalServerError('Request failed with ' + e);
        console.log("Err", err)
      }
      console.log("now return", name)
      return next(err);
    });
  });

});

server.get('/service/:serviceName/:reason/:hookInstance', function(req, res, next){
  console.log("View on", req.params.serviceName);
  services[req.params.serviceName].view(req.params.reason, req.params.hookInstance, req, res, next);
})

server.listen(process.env.PORT || 8081, function () {
  console.log('%s listening at %s', server.name, server.url);
  context(server);
});
