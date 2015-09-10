var restify = require('restify');
var pediatric = require('./pediatric');

var services = [pediatric];

var server = restify.createServer({
  name: 'mock-cds-backend',
  version: '0.0.1'
});

server.use(restify.bodyParser());

services.forEach(function(service){

  server.post('/pediatric-dose-check', function(req, res, next){
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
