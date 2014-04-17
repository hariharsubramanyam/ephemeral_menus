var likert_questions = [
	{
		question:"How <strong>easy</strong> was using the menu?",
		lbl_1: "Hard to Use",
		lbl_7: "Easy to Use"
	},
	{
		question:"How <strong>satisfying</strong> was it to use?",
		lbl_1: "Unsatisfying",
		lbl_7: "Satisfying"
	},
	{
		question:"How <strong>efficient</strong> was the menu?",
		lbl_1: "Inefficient",
		lbl_7: "Efficient"
	},
	{
		question:"How <strong>understandable</strong> was it?",
		lbl_1: "Confusing",
		lbl_7: "Easy to Understand"
	}
];

var likert_responses = [];

var btn_groups = [];

var ParseLikertObject;
var uuid;
$(document).ready(function(){
	Parse.initialize(API_KEY, CLIENT_KEY);
	ParseLikertObject = Parse.Object.extend("LikertResponse");
	uuid = getParameterByName("user_id");
	for(var i = 0; i < likert_questions.length; i++){
		likert_responses.push({
			"question":likert_questions[i].question,
			"lbl_1":likert_questions[i].lbl_1,
			"lbl_7":likert_questions[i].lbl_7,
			"static":null,
			"ephemeral":null
		});
	}
	$("#btnDismissModal").click(function(){
		$(".modal").modal("hide");
	});
	$("#btnSubmit").click(function(){
		var can_submit = true;
		for(var i = 0; i < likert_responses.length; i++){
			if(likert_responses[i]["static"] == null || likert_responses[i]["ephemeral"] == null){
				can_submit = false;
				break;
			}else{
				
			}
		}
		var modal_title = "";
		var modal_body = "";
		if(can_submit){
			submit_responses();
			modal_title = "Congratulations - All Finished!";
			modal_body = "<p>Thank you for participating in the study!</p>";
			$("#btnDismissModal").hide();
		}else{
			console.log("Failed to submit");
			modal_title = "Please fill in all choices";
			modal_body = "<p>Please fill in <strong>all</strong> the choices in order to finish the experiment.</p>"
		}
		$('.modal-title').html(modal_title);
		$('.modal-body').html(modal_body);
		$(".modal").modal();
		
	});
	createLikertElements(likert_questions,"static");
	createLikertElements(likert_questions,"ephemeral");
});

function createLikertElements(questions, div_id){
	var html = "";
	for(var i = 0; i < questions.length; i++){
		var question = questions[i].question;
		var lbl_1 = questions[i].lbl_1;
		var lbl_7 = questions[i].lbl_7;
		html += '<div class="row likert_question"> \
        <h4><em>' + (i+1)+". " + question + '</em></h4> \
        <span>'+ lbl_1+'</span> \
        <div class="btn-group" data-toggle="buttons"> \
          <label class="btn btn-primary"> \
            <input type="radio" name="options" class="likert_option" id="'+div_id+"-"+i+"-"+'1"> 1 \
          </label> \
          <label class="btn btn-primary"> \
            <input type="radio" name="options" class="likert_option" id="'+div_id+"-"+i+"-"+'2"> 2 \
          </label> \
          <label class="btn btn-primary"> \
            <input type="radio" name="options" class="likert_option" id="'+div_id+"-"+i+"-"+'3"> 3 \
          </label> \
          <label class="btn btn-primary"> \
            <input type="radio" name="options" class="likert_option" id="'+div_id+"-"+i+"-"+'4"> 4 \
          </label> \
          <label class="btn btn-primary"> \
            <input type="radio" name="options" class="likert_option" id="'+div_id+"-"+i+"-"+'5"> 5 \
          </label> \
          <label class="btn btn-primary"> \
            <input type="radio" name="options" class="likert_option" id="'+div_id+"-"+i+"-"+'6"> 6 \
          </label> \
          <label class="btn btn-primary"> \
            <input type="radio" name="options" class="likert_option" id="'+div_id+"-"+i+"-"+'7"> 7 \
          </label> \
        </div> \
        <span>'+ lbl_7 +'</span> \
      </div>'
	}
	$("#"+div_id).append($(html));
	$(".likert_option").change(function(){
		var split = this.id.split("-");
		var menu_type = split[0];
		var question_index = Number(split[1]);
		var choice_number = Number(split[2]);
		likert_responses[question_index][menu_type] = choice_number;
	});
}

function submit_responses(){
	for(var i = 0; i < likert_responses.length; i++){
		console.log(uuid);
		var parseObject = new ParseLikertObject();
		likert_responses[i].user_id = uuid;
		parseObject.save(likert_responses[i]).then(function(object) {console.log("Saved a likert response to Parse")});
	}
	// $.ajax({
	// 	type: "POST",
	// 	url: "/api/create_likert_response",
	// 	data: {"likert_responses":likert_responses},
	// 	dataType: "json"
	// });
}

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}