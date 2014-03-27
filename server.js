var express = require('express');
var app = express();

var event_log = [];

app.configure(function() {
	app.use(express.static(__dirname + '/public'));
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
});

app.get('/api/get_event', function(req, res) {
	console.log("getting event");
});

app.post('/api/create_event', function(req, res) {
	event_log.push(req.body.selected_item);
	console.log(event_log);
});

// delete a todo
app.delete('/api/delete_event/:event_id', function(req, res) {
	console.log("Removing " + req.params.event_id);
});

app.get('*', function(req, res) {
	res.sendfile('./public/index.html');
});

app.listen(8080);
console.log("App listening on port 8080");
