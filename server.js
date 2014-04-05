var express = require('express');
var fs = require("fs");
var app = express();

// Read experiment configuration
var experiment_config = JSON.parse(fs.readFileSync("experiment_config.json").toString("utf-8"));
var experiment_state = JSON.parse(fs.readFileSync("experiment_state.json").toString("utf-8"));


app.configure(function() {
	app.use(express.static(__dirname + '/public'));
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
});

app.get('/api/get_experiment', function(req,res){
	experiment_state.total_users += 1;
	fs.writeFile("experiment_state.json", JSON.stringify(experiment_state), function(err) {
		if(err) {
			console.log(err);
		} else {
			console.log("Updated experiment_state.total_users to " + experiment_state.total_users);
		}
	});
	var experiment = generate_experiment_for_user(experiment_config, experiment_state);
	res.send(experiment);
});

app.post('/api/create_event_log', function(req, res) {
	var base_file_name = ("" + new Date()).replace(/ /g, "_");
	fs.writeFile(base_file_name + ".json", JSON.stringify({
		"user_id":experiment_state.total_users,
		"event_log":req.body.event_log
	}));
	var csv_string = "user_id, time, selection, menu_number, num_wrong, type, onset, adaptive_accuracy\n";
	var event_info;
	for(var i = 0; i < req.body.event_log.length; i++){
		event_info = req.body.event_log[i];
		csv_string += experiment_state.total_users + ", " + event_info["time"] + ", " + event_info["selection"] + ", " + event_info["menu_number"] + ", " + event_info["num_wrong"] + ", " + event_info["type"] + ", " + event_info["onset"] + ", " + event_info["adaptive_accuracy"] + "\n";
	}
	fs.writeFile(base_file_name + ".csv", csv_string);
});

app.post('/api/create_likert_response', function(req, res) {
	var base_file_name = ("" + new Date()).replace(/ /g, "_");
	fs.writeFile("likert_response_"+base_file_name + ".json", JSON.stringify({
		"user_id":experiment_state.total_users,
		"likert_responses":req.body.likert_responses
	}));
	var csv_string = "user_id, question, lbl_1, lbl_7, static, ephemeral\n";
	var likert_response;
	for(var i = 0; i < req.body.likert_responses.length; i++){
		likert_response = req.body.likert_responses[i];
		csv_string += experiment_state.total_users + ", " + likert_response["question"].replace(/,/g,"") + ", " + likert_response["lbl_1"] + ", " + likert_response["lbl_7"] + ", " + likert_response["static"] + ", " + likert_response["ephemeral"] +"\n";
	}
	fs.writeFile("likert_response_"+base_file_name + ".csv", csv_string);
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
		onset_delay: 500,
		selections:practice_selections,
		predictions:practice_predictions
	});

	// Get control/onset blocks and counterbalance
	var before_shift = [];
	for(i = 0; i < experiment_config.onset_delays.length; i++){
		before_shift.push({
			type:"onset " + experiment_config.onset_delays[i],
			onset_delay: experiment_config.onset_delays[i],
			selections:actual_selections[i],
			predictions:actual_predictions[i]
		});
	}
	var after_shift = shift_over(before_shift,experiment_state.total_users%experiment_config.num_groups_for_counterbalancing);
	
	for(i = 0; i < experiment_config.onset_delays.length; i++){
		experiment.blocks.push(after_shift[i]);
	}
	experiment.blocks.push({
		type:"finish"
	});

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

/*
	Shifts all elements of array to the right by n
*/
function shift_over(arr, n){
	var new_arr = [];
	for(var i = 0; i < arr.length; i++){
		new_arr[(i+n)%arr.length] = arr[i];
	}
	return new_arr;
}