
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var uploads = require('./routes/uploads');
var schedules = require('./routes/schedules');
var http = require('http');
var path = require('path');
var mongo = require('mongodb');
var monk = require('monk');
var db = monk(process.env.MONGOHQ_URL);

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
// app.set('host', process.env.HOST || 'localhost');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(express.bodyParser());

app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.post('/omnifocus_upload', uploads.create);
app.post('/schedules', schedules.create(db));
app.put('/schedules/:id', schedules.update(db));
app.delete('/schedules/:id', schedules.clear(db));
app.get('/schedules/:id', schedules.show(db));
app.get('*', routes.index);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

module.exports = app;