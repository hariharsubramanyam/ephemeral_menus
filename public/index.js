var menus;
var experiment_manager;
var block_index;
var start_time;
var chosen_menu;
var chosen_index;

$(document).ready(function(){
	menus = generate_menus();
	populate_menus();
	set_handlers();
	$.ajax({
		url: "/api/get_experiment",
		cache: false
	}).done(function( experiment ) {
		experiment_manager = new ExperimentManager(experiment);
		perform_block();
	});
});

function perform_block(){
	var modal_text = experiment_manager.get_modal_text();
	if(experiment_manager.current_block.type == "finish"){
		$("#btnDismissModal").hide();
	}
	$('.modal-title').html(modal_text[0]);
	$('.modal-body').html(modal_text[1]);
	$(".modal").modal();
	$("#btnDismissModal").click(function(){
		block_index = 0;
		chosen_menu = pick_n_from([1,2,3],1);
		chosen_index = experiment_manager.current_block.selections[block_index]-1;
		set_task_label();
	});
}

function set_task_label(){
	$("#lblTask").text("Menu " + chosen_menu + " → " + $(".ijk"+(chosen_menu-1)+parseInt((""+chosen_index/4),10)+(chosen_index%4 + " a")).text());
}

function set_handlers(){
	$('.dropdown-toggle').click(function(){
		on_menu_click(Number($(this).attr("class").replace("dropdown-toggle menutoggle","")));
	});
	$('.dropdown-menu > li').click(on_menu_item_click);
}

function on_menu_click(menu_number){
	start_time = new Date();
	$('.predicted_item').removeClass("predicted_item");
	$(".dropdown-menu > li:not(.predicted_item)").stop().css("opacity",0.0);
	menu_number = menu_number - 1;
	var predicted_choices = get_predicted_choices();
	for(var i = 0; i < predicted_choices.length; i++){
		var group_number = Math.floor((predicted_choices[i]-1)/4);
		var in_group_number = Math.floor(predicted_choices[i]-1)%4;
		$(".ijk"+menu_number+group_number+in_group_number).addClass("predicted_item").css("opacity",1.0);
	}
	$(".dropdown-menu > li:not(.predicted_item)").fadeTo(experiment_manager.current_block.onset_delay, 1.0);
}

function on_menu_item_click(){
	var ijkstring = $(this).attr("class").replace("predicted_item","").replace("ijk","");
	var menu_number = Number(ijkstring[0]);
	var group_number = Number(ijkstring[1]);
	var in_group_number = Number(ijkstring[2]);
	var item_number = 4*group_number+in_group_number+1;
	var selected_item = menus[menu_number][group_number][in_group_number];
	if(chosen_menu == (menu_number+1) && item_number == experiment_manager.current_block.selections[block_index]){
		console.log("Correct in " + (new Date() - start_time));
		block_index += 1;
		if(block_index < experiment_manager.current_block.selections.length){
			chosen_menu = pick_n_from([1,2,3],1);
			chosen_index = experiment_manager.current_block.selections[block_index]-1;
			set_task_label();
		}else{
			experiment_manager.next_block();
			perform_block();
		}
	}
	$.ajax({
		type: "POST",
		url: "/api/create_event",
		data: {"selected_item":selected_item},
		success: function(){console.log("Succeeded");},
		dataType: "json"
	});
}

function populate_menus(){
	for(var i = 0; i < 3; i++){
		for(var j = 0; j < 4; j++){
			for(var k = 0; k < 4; k++){
				$(".ijk"+i+j+k + " a").text(menus[i][j][k]);
			}
		}
	}
}

function get_predicted_choices(){
	var predictions = experiment_manager.current_block.predictions;
	return [predictions[0][block_index], predictions[1][block_index], predictions[2][block_index]];
}

var all_groups = [["Red", "Green", "Blue", "White"],
["Islam", "Christianity", "Judaism", "Hinduism"],
["Washington", "Lincoln", "Adams", "Jefferson"],
["Fire", "Water", "Earth", "Air"],
["Google", "Facebook", "Microsoft", "Apple"],
["Russia", "China", "France", "India"],
["Penguin", "Ostrich", "Kiwi", "Flamingo"],
["Guitar", "Drums", "Violin", "Piano"],
["Shakespeare", "Hemingway", "Fitzgerald", "Twain"],
["Football", "Baseball", "Hockey", "Soccer"],
["Thor", "Iron Man", "Captain America", "Hulk"],
["Pizza", "Hamburger", "Burrito", "Panini"],
["Ford", "Mazda", "Toyota", "Chevrolet"],
["Winter", "Spring", "Summer", "Autumn"],
["Tulip", "Daisy", "Rose", "Violet"],
["Onion", "Cabbage", "Potato", "Eggplant"],
["Rolling Stones", "Beatles", "Led Zeppelin", "The Who"],
["Forrest Gump", "Titanic", "Star Wars", "Braveheart"]];

function generate_menus(){
	return generate_NxG_menus(all_groups, 3, 4);
}

/*
	Given a set of groups, randomly create N menus with G groups each
	Input:
		groups = [group_1, group_2, ...,]
			where group_i = [item_1, item_2, ...]
		N = the number of menus to return
		G = the number of groups in each menu
	Output:
		menus = [menu_1, menu_2, ..., menu_n]
			where menu_i = [group_r1, group_r2, ..., group_rG] 
				(where group_r1, group_r2, ..., group_rG are randomly selected groups from groups)
*/
function generate_NxG_menus(groups, N, G){
	var chosen_groups = pick_n_from(groups, 12);
	var menus = [];
	for(var i = 0; i < N; i++){
		menus.push([]);
		for(var j = 0; j < G; j++){
			menus[i].push(chosen_groups[G*i+j]);
		}
	}
	return menus;
}

/*
	Randomly picks n elements from a list of n choices
	Input:
		choices = list of elements to pick from
		n = number of elements to pick
	Output:
		chosen = list of n randomly chosen elements from choices
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
