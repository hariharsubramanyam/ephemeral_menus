var express = require('express');
var fs = require("fs");
var app = express();

// Read experiment configuration
var experiment_config = JSON.parse(fs.readFileSync("experiment_config.json").toString("utf-8"));
var experiment_state = JSON.parse(fs.readFileSync("experiment_state.json").toString("utf-8"));
generate_experiment_for_user(experiment_config, experiment_state);


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

function generate_experiment_for_user(experiment_config, experiment_state){
	
}

function generate_selection_sequence(num_selections){
	var freqs = [15,15,8,8,5,5,4,4,3,3,3,3,2,2,2,2];
	var array_accounting_for_freqs = [];
	for(var i = 1; i <= 16; i++){
		for(var j = 0; j < freqs[i-1]; j++){
			array_accounting_for_freqs.push(i);
		}
	}
	var selection_sequence = [];
	var random_index;
	
	for(i = 0; i < num_selections; i++){
		random_index = Math.floor(Math.random()*array_accounting_for_freqs.length);
		selection_sequence.push(array_accounting_for_freqs[random_index]);
	}

	return selection_sequence;
}