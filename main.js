

EAD = {};


EAD.root = document.getElementById("main");
EAD.text_load = document.getElementById("text_load");
EAD.cur_id = 1;
EAD.node_type_names = [
	"",
	"emotion",
	"activity",
	"design"
];
EAD.node_type_desc = [
	"The reason the game will be enjoyable is because it will cause players to have a sense of ...",
	"... and for the player to have this reaction they will do things like ...",
	"... and the player will care enough to do this and will have this reaction because ...",
	null,
];
EAD.nodes = {
	'main':{
		node:document.getElementById(`main`),
		list:document.getElementById(`main_list`),
		textarea:document.getElementById(`textarea_main`),
		id:"main",
		type:0,
		children:[],
	},
};

EAD.is_debug = false;

EAD.log = function(text) {
	if (!EAD.is_debug) {return;}
	return console.log(text);
}

EAD.html_fragment_from_string = function(html_string) {
	let frag = document.createDocumentFragment(),
		temp = document.createElement('div');
	temp.innerHTML = html_string;
	while (temp.firstChild) {
		frag.appendChild(temp.firstChild);
	}
	return frag;
}

EAD.create_node = function(type, host, value) {
	let t = [];
	if (value == null) {value = ""}
	EAD.cur_id += 1;
	let id = EAD.cur_id;
	t.push(`<div class="node node_${type}" id="${id}">`);
	// horizontal elements
	t.push(`<div class="horizontal_flex">`);
		// allows textarea to 'grow' with more lines
		t.push(`<div class="textarea-grow" id="grow_${id}">`);
			t.push(`<textarea onInput="this.parentNode.dataset.replicatedValue=this.value" \
			class="textfield_${type}" id="textarea_${id}" name="name" spellcheck="false" rows="1" cols="800">${value}</textarea>`);
		t.push(`</div>`);

		t.push(`<button class="button button_remove" type="button" name="button" onclick="EAD.on_button_remove('${id}')">-</button>`);
		let type_name = EAD.node_type_names[type]
		if (type_name == null) {type_name = ""}
		t.push(`<p class="subtitletext">${type_name}</p>`);
	// end horizontal end section
	t.push(`</div>`);

	if (EAD.node_type_desc[type] != null) {
		t.push(`<p class="subtitledesc">${EAD.node_type_desc[type]}</p>`);
	}
	if (type <= 2) {
		t.push(`<div class="node_list" id="list_${id}"></div>`);
	}

	t.push(`<div class="horizontal_flex">`);
	if (type <= 2) {
		t.push(`<button class="button button_add" type="button" name="button" onclick="EAD.on_button_add('${id}')">+</button>`);
	}
	t.push(`</div>`);
	// end whole node
	t.push(`</div>`);
	let html = t.join("");
	let node = EAD.html_fragment_from_string(html);
	let def = {};
	def.type = type;
	def.host_def = host;
	def.children = [];
	def.id = id;
	def.node = node;
	EAD.add_node(host, def);
	def.node = document.getElementById(`${id}`);
	def.textarea = document.getElementById(`textarea_${id}`);
	// also add the text to the "spacer" node to make textarea big enough for any newlines
	def.grow = document.getElementById(`grow_${id}`);
	def.grow.dataset.replicatedValue = value
	def.list = document.getElementById(`list_${id}`);
	return def;
};

EAD.add_node = function(parent_def, child_def) {
	EAD.nodes[String(child_def.id)] = child_def;
	parent_def.list.appendChild(child_def.node);
	parent_def.children.push(child_def);
	EAD.log(`added ${child_def.id}`)
}

EAD.on_button_add = function(id) {
	let def = EAD.nodes[id];
	if (def == null) {return;}
	let type = 0;
	if (def != null) {type = def.type;}
	if (type == null) {type = 0;}
	EAD.create_node(type + 1, def);
}

EAD.remove_children = function(def) {
	EAD.log("remove_children")
	if (def.children.length <= 0) {
		EAD.log(`no children to remove for ${def.id}`)
		return;
	}
	// if (def.removed) {return;}
	for (let i = def.children.length - 1; i >= 0; i--) {
		EAD.log(`  ${def.textarea.value} ${i}`)
		let child_def = def.children[i];
		EAD.remove_children(child_def);
		child_def.node.remove();
		def.children.splice(i, 1);
		EAD.log(`removed ${child_def.id}`)
		EAD.nodes[child_def.id] = null;
	}
}

EAD.remove_child = function(def, child_def) {
	EAD.log("remove_child")
	if (def.children.length <= 0) {return;}
	for (let i = 0; i < def.children.length; i++) {
		if (def.children[i].id == child_def.id) {
			def.children.splice(i, 1);
			EAD.log("remove through remove_child")
		}
	}
	EAD.remove_children(child_def);
	child_def.node.remove();
	child_def.removed = true;
	EAD.nodes[child_def.id] = null;
}

EAD.on_button_remove = function(id) {
	let def = EAD.nodes[id];
	if (def && def.host_def != null) {
		EAD.remove_child(def.host_def, def);
	}
}

EAD.collapse_into_savable = function(def, iter) {
	EAD.log(`PROCESSING "${def.textarea.value}" START`)
	let text = "NONE";
	if (def.textarea != null) {
		text = String(def.textarea.value);
	}
	let t = [
		text,
	];
	if (def.children.length <= 0) {
		return t;
	}
	EAD.log(`CHILD "${def.textarea.value}" HAS ${def.children.length} CHILDREN`)
	for (let i = 0; i < def.children.length; i++) {
		EAD.log("    LOOP ITER")
		let child_def = def.children[i];
		if (child_def.removed) {
			EAD.log(`CHILD "${def.textarea.value}" IS ALREADY REMOVED`)
			continue;
		}
		iter += 1;
		if (iter > 1000) {EAD.log("TOO MANY ITERATIONS"); return t;}
		t.push(EAD.collapse_into_savable(child_def, iter));
	}
	EAD.log(`CHILD "${def.textarea.value}" FINISHED`)
	return t;
}

EAD.serialise_all = function() {
	let savable = EAD.collapse_into_savable(EAD.nodes["main"], 0);
	// let str = JSON.stringify(savable, null, "	");
	let str = JSON.stringify(savable);
	EAD.log(str);
	return str;
}

EAD.deserialise_data_node = function(data, host_def) {
	if (data.length <= 0) {return;}
	let def;
	if (host_def == null) {
		host_def = EAD.nodes["main"];
		host_def.textarea.value = data[0];
		def = host_def;
	}
	if (def == null) {
		EAD.log(`CREATING NODE FOR ${data[0]}`)
		def = EAD.create_node(host_def.type + 1, host_def, data[0]);
	}

	if (data.length <= 1) {return;}
	for (let i = 1; i < data.length; i++) {
		EAD.deserialise_data_node(data[i], def);
	}
}

EAD.deserialise_all = function(str) {
	EAD.log(`===========================\n\n`)
	EAD.remove_children(EAD.nodes["main"]);
	EAD.log(EAD.nodes)
	let data;
	try {
		data = JSON.parse(str);
		EAD.deserialise_data_node(data);
	}
	catch(err) {
		EAD.log(err.message);
		return;
	}
}

EAD.save = function() {
	EAD.text_load.value = "";
	EAD.text_load.value = EAD.serialise_all();
}
EAD.load = function() {
	EAD.deserialise_all(EAD.text_load.value);
}

EAD.nodes["main"].textarea.value = `EAD DESIGN SYSTEM`;

