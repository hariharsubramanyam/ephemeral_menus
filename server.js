var express = require('express');
var fs = require("fs");
var app = express();

// Read experiment configuration
var experiment_config = JSON.parse(fs.readFileSync("experiment_config.json").toString("utf-8"));
var experiment_state = JSON.parse(fs.readFileSync("experiment_state.json").toString("utf-8"));

var event_log = [];

app.configure(function() {
	app.use(express.static(__dirname + '/public'));
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
});

app.get('/api/get_experiment', function(req,res){
	var experiment = generate_experiment_for_user(experiment_config, experiment_state);
	experiment_state.total_users += 1;
	fs.writeFile("experiment_state.json", JSON.stringify(experiment_state), function(err) {
		if(err) {
			console.log(err);
		} else {
			console.log("Updated experiment_state.total_users to " + experiment_state.total_users);
		}
	});
	res.send(experiment);
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

	// Pick an adaptive accuracy
	var adaptive_accuracy = experiment_config.adaptive_accuracies[experiment_state.total_users%experiment_config.adaptive_accuracies.length];

	// Generate the selections and predictions for the practice condition
	var current_index = 0;
	var practice_selections = subarray(experiment_config.selection_sequence, current_index, experiment_config.selections_for_practice);
	var practice_predictions = generate_predictions(practice_selections, adaptive_accuracy);

	current_index += experiment_config.selections_for_practice;

	// Generate the selections and predictions for each of the onsets
	var actual_selections = [];
	var actual_predictions = [];
	var tmp_selections;
	for(var i = 0; i < experiment_config.onset_delays.length; i++){
		tmp_selections = subarray(experiment_config.selection_sequence, current_index, experiment_config.selections_per_condition);
		actual_selections.push(tmp_selections);
		actual_predictions.push(generate_predictions(tmp_selections, adaptive_accuracy));
		current_index += experiment_config.selections_per_condition;
	}

	var experiment = {
		"adaptive_accuracy":adaptive_accuracy,
		blocks:[]
	};
	experiment.blocks.push({
		type:"practice",
		selections:practice_selections,
		predictions:practice_predictions
	});

	for(i = 0; i < experiment_config.onset_delays.length; i++){
		experiment.blocks.push({
			type:"onset " + experiment_config.onset_delays[i],
			selections:actual_selections[i],
			predictions:actual_predictions[i]
		});
	}

	return experiment;
}

/*
	Generates a list of three predictions per selection (with the desired_accuracy) given a list of selections
	selections[i] has three predictions -> predictions[0][i], predictions[1][i], and predictions[2][i]
*/
function generate_predictions(selections, desired_accuracy){
	// selections[i] has three predictions -> predictions[0][i], predictions[1][i], and predictions[2][i]
	var predictions = [[],[],[]];

	// Based on the desired accuracy, compute how many predictions should be corrrect
	var num_should_be_correct = Math.floor(desired_accuracy/100.0*selections.length);
	
	// Create a list from 0 to selections.length - 1 (these are the indices) -> we'll need this in order to pick the predictions that should be correct
	var all_indices = range(0,selections.length,1);

	// Should_be_correct[i] means that either predictions[0][i] == selections[i] or predictions[1][i] == selections[i] or predictions[2][i] == selections[i]
	var should_be_correct = pick_n_from(all_indices, num_should_be_correct);

	var wrong_predictions;
	var choices;
	// Make each set of three predictions
	for(i = 0; i < selections.length; i++){
		// here are the possible choices
		choices = range(1,17,1);
		// remove the correct choice
		choices.splice(selections[i]-1,1);
		// generate three wrong predictions
		wrong_predictions = pick_n_from(choices,3);
		predictions[0][i] = wrong_predictions[0];
		predictions[1][i] = wrong_predictions[1];
		predictions[2][i] = wrong_predictions[2];
		// if one prediction should be correct, make it correct
		if(contains(should_be_correct,i)){
			predictions[0][i] = selections[i];
		}
	}

	return predictions;
}

/*
	Generates a selection sequence of length num_selections
		weighted such that elements at the top of the menu are more likely to be chosen than elements at the bottom
*/
function generate_selection_sequence(num_selections){

	// UNCOMMENT THIS LINE TO MAKE EVERY INDEX (1 THROUGH 16) HAVE AN EQUAL PROBABILITY OF BEING PICKED
	//var freqs = array_of_repeated_val(1, 16);

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

/*
	Returns n distinct randomly chosen values from the array choices
*/
function pick_n_from(choices, n){
	var indices = [];
	for(var i = 0; i < choices.length; i++){
		indices.push(i);
	}
	for(i = 0; i < n; i++){
		var swap_with = Math.floor(Math.random()*choices.length);
		var temp = indices[swap_with];
		indices[swap_with] = indices[i];
		indices[i] = temp;
	}
	var chosen = [];
	for(i = 0; i < n; i++){
		chosen.push(choices[indices[i]]);
	}
	return chosen;
}

/*
	Returns the subarray from start_index to start_index+length-1,
		arr[start_index], arr[start_index+1],..., arr[start_index+length-1]
*/
function subarray(arr, start_index, length){
	var subarr = [];
	for(var i = start_index; i < start_index + length; i++){
		subarr.push(arr[i]);
	}
	return subarr;
}

/*
	Returns true if arr contains val, returns fals otherwise
*/
function contains(arr, val){
	for(var i = 0; i < arr.length; i++){
		if(arr[i] == val){
			return true;
		}
	}
	return false;
}

/*
	Returns an array of the values from start to end, in increments of step
*/
function range(start, end, step){
	var result = [];
	for(var i = start; i < end; i += step){
		result.push(i);
	}
	return result;
}

/*
	Returns an array of length num_repeats where every element is val
*/
function array_of_repeated_val(val, num_repeats){
	var arr = [];
	for(var i = 0; i < num_repeats; i++){
		arr.push(val);
	}
	return arr;
}