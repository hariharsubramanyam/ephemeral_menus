function ExperimentManager(experiment){
	
	var self = this;

	self.blocks = experiment.blocks;
	self.adaptive_accuracy = experiment.adaptive_accuracy;
	self.block_counter = 0;
	self.current_block = self.blocks[self.block_counter];

	self.get_modal_text = function(){
		var block_type = self.current_block.type;
		if(block_type === "practice"){
			return ["<h1>Welcome</h1>", "<p>Thank you for participating in this study!</p><p>The goal of the study is to <strong>compare two kinds of menus</strong> to see which is faster:</p><ul><li>A <strong>Static Menu</strong> is a traditional menu - it displays a list of items when clicked</li><li>An <strong>Ephemeral Menu</strong> is a menu which tries to predict the item you want to click and displays a few items while the others slowly <em>fade in</em></li></ul><p>The experiment will show you three menus, and <strong>ask you to pick items</strong> from them </p><p>(ex. Menu 1 -> Peppers)</p><p>Let's start with a <strong>PRACTICE</strong> run to help you get acquainted with the experiment</p>"];
		}else if(block_type === "onset 0"){
			return ["<h1>Static Menus</h1>", "<p>Nice work! Next, we'll move on to <strong>Static Menus</strong>.</p><p>A Static Menu simply displays a list of items when clicked.</p><p>Again, we'll ask you to <strong>pick items from the three menus</strong></p><p>(ex. Menu 1 -> Peppers)</p>"];
		}else if (block_type === "finish"){
			return ["<h1>Finished</h1>", "<p><strong>Congratulations!</strong></p><p>The experiment is <strong>finished</strong>!</p><p>Thank you for your participation!</p>"];
		}else{
			return ["<h1>Ephemeral Menus</h1>", "<p>Great job! Next, we'll move on to the <strong>Ephemeral Menus</strong>.</p><p>An Ephemeral Menu will try to predict the item you want to click an display a few items immediately while the others <strong>fade in</strong>.</p><p>Again, we'll ask you to <strong>pick items from the three menus</strong></p><p>(ex. Menu 1 -> Peppers)</p>"];
		}
	};

	self.next_block = function(){
		if(self.current_block.type != "finish"){
			self.block_counter++;
			self.current_block = self.blocks[self.block_counter];
		}
	};
	
	return self;
}