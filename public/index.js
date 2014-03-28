var menus;

$(document).ready(function(){
	menus = generate_menus();
	$('.dropdown-toggle').click(function(){
		on_menu_click(Number($(this).attr("class").replace("dropdown-toggle menutoggle","")));
	});
	$('.dropdown-menu > li').click(on_menu_item_click);
	populate_menus();
	$.ajax({
		url: "/api/get_experiment",
		cache: false
	}).done(function( data ) {
		console.log(data);
	});
});

function on_menu_click(menu_number){
	$('.predicted_item').removeClass("predicted_item");
	$(".dropdown-menu > li:not(.predicted_item)").stop().css("opacity",0.0);
	menu_number = menu_number - 1;
	var predicted_choices = get_predicted_choices();
	for(var i = 0; i < predicted_choices.length; i++){
		var group_number = Math.floor((predicted_choices[i]-1)/4);
		var in_group_number = Math.floor(predicted_choices[i]-1)%4;
		$(".ijk"+menu_number+group_number+in_group_number).addClass("predicted_item").css("opacity",1.0);
	}
	$(".dropdown-menu > li:not(.predicted_item)").fadeTo(1000, 1.0);
}

function on_menu_item_click(){
	var ijkstring = $(this).attr("class").replace("predicted_item","").replace("ijk","");
	var menu_number = Number(ijkstring[0]);
	var group_number = Number(ijkstring[1]);
	var in_group_number = Number(ijkstring[2]);
	var item_number = 4*group_number+in_group_number+1;
	var selected_item = menus[menu_number][group_number][in_group_number];
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
	function rand_int(n){
		return Math.floor(Math.random()*n)+1;
	}
	return [rand_int(16),rand_int(16),rand_int(16)];
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
