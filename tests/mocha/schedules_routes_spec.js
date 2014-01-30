var assert = require('chai').assert,
  request = require('supertest'),
  app = require('../../app'),
  models = require('../../models'),
  async = require('async');

describe('schedules', function(){
  beforeEach(function(done) {
    models.db.query('delete from events').success(function() {
      models.db.query('delete from schedules').success(done);
    });
  });

  describe('#create', function(){
    it('should save some events', function(done){
      var postBody = [
        {title: 'first', start: 'fdsafsd'}
      ];
      request(app)
        .post('/schedules')
        .send(postBody)
        .end(function(err, res) {
          if (err) {
            throw err;
          }
          assert.equal(res.status, 200);
          assert.isNotNull(res.body.guid);
          assert.equal(res.body.events.length, 1);
          assert.equal(res.body.events[0].title, 'first');
          models.Event.count().success(function(count) {
            assert.equal(1, count);
            done();
          });
        });
    });

    it('should associate those events with a schedule', function(done) {
      var postBody = [
        {title: 'first', start: 'fdsafsd'}
      ];
      request(app)
        .post('/schedules')
        .send(postBody)
        .end(function(err, res) {
          if (err) {
            throw err;
          }
          assert.equal(res.status, 200);
          models.Schedule.count().success(function(count) {
            assert.equal(1, count);
            models.Schedule.findAll().success(function(schedules) {
              assert.isNotNull(schedules[0].guid);
              done();
            });
          });
        });            
    });

    it('should update pre-existing events', function(done) {
      async.waterfall([
        function setup(callback) {
          models.Event.create({title: 'foobar'}).complete(callback);
        },
        function update(event, callback) {
          request(app)
            .post('/schedules')
            .send([{id: event.id, title: 'new title'}])
            .end(function(err, res) {
              callback(err, event);
            });
        },
        function fetchUpdatedEvent(event, callback) {
          models.Event.find(event.id).success(callback);
        }
      ], function(updatedEvent) {
        assert.equal(updatedEvent.title, 'new title');
        done();
      });
    });
  });

  describe('#clear', function() {
    it('clears out all the events (not just todays)', function(done) {
      async.waterfall([
        function setup(next) {
          models.Event.create({title: 'foobar'}).complete(next);
        },
        function update(event, next) {
          request(app)
            .del('/schedules/today')
            .end(function(err, res) {
              next(err);
            });
        }
      ], function() {
        models.Event.count().success(function(count) {
          assert.equal(0, count);
          done();
        });
      });      
    });
  });

  describe('#show', function() {
    it('returns all the events for a given schedule', function(done) {
      function setup() {
        models.Schedule.create({guid: 'foo'}).success(function(schedule) {
          models.Event.create({title: 'foobar event title'}).success(function(event) {
            schedule.addEvent(event).complete(function(err) {
              verify(err, schedule);
            });
          });
        });
      }

      function verify(err, schedule) {
        request(app)
          .get('/schedules/foo')
          .end(function(err, res) {
            assert.equal(res.body.length, 1);
            assert.equal(res.body[0].title, 'foobar event title');
            done(err);
          });
      }

      setup();
    });
  });
});