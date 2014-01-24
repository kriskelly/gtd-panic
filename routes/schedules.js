var models = require('../models');
var async = require('async');

var Event = models.Event;
var Schedule = models.Schedule;
var db = models.db;

// Create a new schedule
exports.create = function(req, res){
	saveEvents(req.body, function(events) {
			res.json(events);
	});
};

function saveEvents(eventsJson, done) {
	Schedule.create({}).complete(function (err, schedule) {
		if (!!err) {
			console.log('The schedule has not been saved:', err);
		}
		// Create a set of events and associate with the schedule
		async.map(eventsJson, function(eventJson, callback) {
      function updateEvent(eventJson, callback) {
        Event.find(eventJson.id).success(function(event) {
          delete eventJson.id;
          event.updateAttributes(eventJson).complete(function(err, event) {
            callback(err, event);
          });
        });
      }

      function createEvent(eventJson, callback) {
        Event.create(eventJson).complete(function(err, event) {
          if (!!err) {
            console.log('The event has not been saved:', err);
          }
          schedule.addEvent(event).complete(function(err) {
            if (!!err) {
              console.log('The event has not been added to the schedule:', err);
            }
            callback(err, event);         
          });
        });
      }

      // There has got to be a cleaner way to do this.
      if (eventJson.id) {
        updateEvent(eventJson, callback);
      } else {
        createEvent(eventJson, callback);        
      }
		}, function(err, events) {
      if (err) {
        throw err;
      }
			done(events);
		});
	});
}

// Display a previously created schedule
exports.show = function(req, res) {
  Event.findAll({where: {ScheduleId: req.params.id}}).complete(function(err, events) {
    if (!!err) {
      console.log('Find failed: ', err);
    }
    res.json(events);
  }); 	
}

exports.today = function(req, res) {
  var start = new Date();
  start.setHours(0);
  start.setMinutes(0);
  start.setSeconds(0);
  var end = new Date();
  end.setHours(23);
  end.setMinutes(59);
  end.setSeconds(59);
  Event.findAll({where: ['start > ? and start < ?', start, end]}).success(function(events) {
    res.json(events);
  });
}

exports.clear = function(req, res) {
  // No truncate in sqlite
  db.query('delete from events').success(function() {
    res.send(200);
  }); 
}