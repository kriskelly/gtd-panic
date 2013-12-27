gtdPanic.controller('ScheduleController', function($scope) {
	function shuffle(array) {
	    var counter = array.length, temp, index;

	    // While there are elements in the array
	    while (counter--) {
	        // Pick a random index
	        index = (Math.random() * counter) | 0;

	        // And swap the last element with it
	        temp = array[counter];
	        array[counter] = array[index];
	        array[index] = temp;
	    }

	    return array;
	}

	$scope.uiConfig = {
		defaultDuration: 30,
		cutoffTime: 23,
		calendar: {
			allDayDefault: false,
			editable: true,
			defaultView: 'agendaDay',
			minTime: moment().hour(),
			dayClick: function(date, allDay, jsEvent, view) {
				var newEvent = {
					title: 'New Event',
					start: moment(date).unix(),
					end: moment(date).add('minutes', 30).unix()
				};
				$scope.$apply(function() {
					$scope.events.push(newEvent);
				});
			},
			eventDrop: function(event, dayDelta, minuteDelta) {
				function moveEvent(event) {
					// When moving an event,
					//	insert the event into the right place in the list (original index & new index)
					//		if +delta (event moved forward)
					//			move all events between original and new index backwards by event's duration
					//		if -delta
					//			move all events between original and new index forwards by event's duration
					// 	all events after the event should be moved forward by the 
					function moveEventWithinList(event) {
						var index = $scope.events.indexOf(event);
						// Assume that events are sorted by start time

						// Remove the event and add it back in the right place
						$scope.events.splice(index, 1);
						
						// Find the event that is immediately following this moved event's new time
						var eventStart = moment(event.start);
						var firstAfter = _.find($scope.events, function(otherEvent) {
							var otherEventStart = moment(otherEvent.start);
							if (eventStart.isSame(otherEventStart) || otherEventStart.isAfter(eventStart)) {
								return otherEvent;
							}
						});
						var firstAfterIndex = $scope.events.indexOf(firstAfter);

						$scope.events = $scope.events.slice(0, firstAfterIndex).concat(event, $scope.events.slice(firstAfterIndex));						
					}

					moveEventWithinList(event);					
					var secondDelta = (minuteDelta * 60);
					var newStartTime = moment(event.start).unix();
					var oldStartTime = newStartTime - secondDelta;
					var newEndTime = moment(event.end).unix();
					function moveDisplacedEvents(moveForward) {
						// Need to displace some existing events
						angular.forEach($scope.events, function(movingEvent) {
							if (movingEvent === event) {
								return;
							}
							movingEventStart = moment(movingEvent.start).unix();
							movingEventEnd = moment(movingEvent.end).unix();
							console.log(
								moment.unix(oldStartTime).toString(), 
								moment.unix(movingEventStart).toString(),
								moment.unix(movingEventEnd).toString(),
								moment.unix(newEndTime).toString()
								);
							if (moveForward) {
								// Between new start time and old start time
								if (movingEventStart >= newStartTime && movingEventEnd <= oldStartTime) {
									console.log(movingEvent.title, "is displaced and moved back by ", event.duration, "seconds"); 
									movingEvent.start = movingEventStart + event.duration;
									movingEvent.end = movingEventEnd + event.duration;									
								}
							} else {
								if (movingEventStart >= oldStartTime && movingEventEnd <= newEndTime) {
									console.log(movingEvent.title, "is displaced and moved back by ", event.duration, "seconds"); 
									movingEvent.start = movingEventStart - event.duration;
									movingEvent.end = movingEventEnd - event.duration;
								}								
							}
						});						
					}
					if (minuteDelta > 1) {
						moveDisplacedEvents(false);
					} else {
						moveDisplacedEvents(true);
					}					
				}
				$scope.$apply(function() {
					moveEvent(event);
				});
			},
			// TODO: Add event for dragging (resort the events in the list)
			eventResize: function(event,dayDelta,minuteDelta,revertFunc) {
				// Change the duration of this event and fix the start/end times for all events after this one
				var secondsDelta = minuteDelta * 60;
				$scope.$apply(function() {
					event.duration = event.duration + secondsDelta;
					event.end = event.end + (event.duration * 1000);
					// Now iterate over all events and set their dates accordingly
					var index = $scope.events.indexOf(event);
					moveEventsAfter(index);
				});
				function moveEventsAfter(index) {
					// var comparator = function(eventA, eventB) {
					// 	var startA = moment(eventA.start);
					// 	var startB = moment(eventB.start);
					// 	if (startA.isBefore(startB)) {
					// 		return -1;
					// 	} else if (startA.isAfter(startB)) {
					// 		return 1;
					// 	} else {
					// 		return 0;
					// 	}
					// }
					// $scope.events = events.slice(0, index).sort(comparator).concat(events.slice(index));
					for (var i = index + 1; i < $scope.events.length; i++) {
						var eventToMove = $scope.events[i];
						eventToMove.start = moment(eventToMove.start).add('seconds', secondsDelta).unix();
						eventToMove.end = moment(eventToMove.end).add('seconds', secondsDelta).unix();
					};

				}
			}
		}
	};

	$scope.eventSources = [];
	$scope.events = [];
	$scope.eventSources.push($scope.events);

	$scope.$watch('allEvents', function(allEvents) {
		if (!allEvents) {
			return;
		}
		if ($scope.uiConfig.randomize) {
			allEvents = shuffle(allEvents);
		}

		var startTime = moment();
		var endTime = moment({hour: $scope.uiConfig.cutoffTime});

		function setupEventDuration(event) {
			// Duration is in seconds for some reason
			if (!event.duration) {
				event.duration = $scope.uiConfig.defaultDuration * 60;
			}

			event.start = startTime.unix();
			startTime = startTime.add('seconds', event.duration);
			event.end = startTime.unix();
		}
		
		function setupEvent(event) {
			// Skip events after the cutoff
			if (startTime.isAfter(endTime)) {
				return;
			}
			setupEventDuration(event);

			// console.log(event);
			$scope.events.push(event);
		}
		angular.forEach(allEvents, setupEvent);
	});

	$scope.remove = function($index) {
		$scope.events.splice($index, 1);
	}
});