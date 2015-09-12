var restify = require('restify');
var pediatric = require('./pediatric');
var prices = require('./prices');

var services = {
  'pediatric-dose-check': pediatric,
  'cms-price-check': prices
};

var server = restify.createServer({
  name: 'mock-cds-backend',
  version: '0.0.1'
});

server.use(restify.bodyParser());
server.use(restify.CORS());

Object.keys(services).forEach(function(name){
  var service = services[name];

  server.post('/' + name, function(req, res, next){
    service(req.body, function(err, cdsResult){
      res.json(cdsResult);
      if (err)
        err = new restify.errors.InternalServerError('Request failed with ' + e);
      return next(err);
    });
  });
});

server.listen(process.env.PORT || 8081, function () {
  console.log('%s listening at %s', server.name, server.url);
});
