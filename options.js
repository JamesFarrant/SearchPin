var target_data;
var target_list = $('.search_target_list');
var new_target,name,url,shortcut;

function save_targets() {
	chrome.extension.getBackgroundPage().save_targets(target_data);
}

function load_targets() {
	chrome.extension.getBackgroundPage().load_targets(initalise);
}

function initalise(data) {
	target_data = data;

    for(var i = target_data.length-1; i >= 0; i--) {
    	if(target_data[i] != undefined) {
        	add_target(i,true);
        }
    }

    parse_icons();
}

load_targets();

function add_target(target_id, prepend) {
	new_target = $('<div class="search_target hoverable">');
	new_target.attr("id","target_"+target_id)
	new_target.data("id",target_id);


	icon_el = $('<div class="icon"></div>')
	if(target_data[target_id].url == "") { 
		url_el = $('<div class="url"></div>')
		.text("click to add");
	} else {
		url_el = $('<div class="url"></div>')
		.text(target_data[target_id].url);
	}
	name_el = $('<div class="name"></div>')
	.text(target_data[target_id].name);
	shortcut_el = $('<div class="shortcut"></div>')
	.text("@"+target_data[target_id].shortcut);


	new_target.append([url_el, name_el,shortcut_el,icon_el]);

	if(prepend) {
		target_list.prepend(new_target);
	} else {
		target_list.append(new_target);
	}

	new_target.on("click",function() {
		setupEditor($(this).data('id'));
	});
	return new_target
}

function remove_target(target_id) {
	$("#target_"+target_id).remove();
	delete target_data[target_id];
	save_targets();
}

$("#remove_button").on("click",function() {
	remove_target(editor.data('id'));
});


$("#target_new").on("click",function() {
	setupEditor();
});

// icons
function getUpdateCallback(target) {
	return function(image, colour) {
		var icon = target.getElementsByClassName("icon")[0];
		if(typeof image === "string") {
			icon.style.backgroundImage = 'url('+image+')';
		} else {
			icon.style.backgroundImage = 'url('+image.src+')';
		}
		for(var i in colour) {
			colour[i] = Math.round(255*(1-Math.pow(1-colour[i]/255,1/2)));
		}
		icon.style.backgroundColor = 'white';
		icon.style['border'] = '6px solid rgba('+colour.join(',')+',0.5)';

	}
}

function parse_icons() {
	var targets = document.getElementsByClassName("search_target");
	for(var i = 0; i < targets.length; i++) {
		var target = targets[i];

		var urlField = target.getElementsByClassName("url")[0];
		if(urlField) {
			var url = urlField.innerText.replace(/https?:\/\//i,'').split('/')[0];

			var background_page = chrome.extension.getBackgroundPage();
			background_page.getFavicon("https://"+url, getUpdateCallback(target));
		}
	}
}

// editor
var editor = $("#search_target_editor");

function setupEditor(target_id) {
	if(target_id === undefined) {
		target_id = target_data.length;
		target_data[target_id] = {name:"New Target",shortcut:"",url:""};
		getUpdateCallback(add_target(target_id,true)[0])('world.png',[100,250,100])

	}
	editor.show();

	var target = target_data[target_id];
	editor.data('id',target_id);

	$("#search_target_editor #shortcut")[0].value = target.shortcut;
	$("#search_target_editor #name")[0].value = target.name;
	if(target.url == "") {
		$("#search_target_editor #url")[0].textContent = "click to add";
	} else {
		$("#search_target_editor #url")[0].textContent = target.url;
	}

	$(".search_target").removeClass("selected_target");
	$("#target_"+target_id).addClass("selected_target");
}

function editorChanged() {
	if(editor.data('id') === undefined) { return; }
	var id = editor.data('id');
	var target = $("#target_"+id);
	target.find(".shortcut").text("@"+target_data[id].shortcut);
	target.find(".name").text(target_data[id].name);
	target.find(".url").text(target_data[id].url);

	save_targets();
}

$("#search_target_editor #shortcut").on('change', function() {
	if(editor.data('id') === undefined) { return; }
	target_data[editor.data('id')].shortcut = $(this)[0].value.toLowerCase();
	editorChanged();
})

$("#search_target_editor #name").on('change', function() {
	if(editor.data('id') === undefined) { return; }
	target_data[editor.data('id')].name = $(this)[0].value;
	editorChanged();
})

$("#search_target_editor #url").on( "click", function() {
	$("#pattern_editor").toggle();
	editorChanged();
})


// initial code

//editor.hide();
$("#pattern_editor").hide();


// shortcut editor
$('#shortcut').bind('keypress', function (event) {
    var regex = new RegExp("^[a-zA-Z0-9]+$");
    var key = String.fromCharCode(!event.charCode ? event.which : event.charCode);
    if (!regex.test(key)) {
       event.preventDefault();
       return false;
    }
});




// url editor
$('body').on('focus', '[contenteditable]', function() {
    var $this = $(this);
    $this.data('before', $this.text());
    return $this;
}).on('blur keyup paste input', '[contenteditable]', function() {
    var $this = $(this);
    if ($this.data('before').trim() !== $this.text().trim()) {
        $this.data('before', $this.text());
        $this.trigger('change');
    }
    return $this;
});

$('#url_pattern').on('change', function() {
	var textbox = $('#url_pattern')[0];

	if(!textbox.textContent.match(/\*/)) { return; }

	// find the cursor
	var child_node, range, caretPos = 0, sel = window.getSelection();
	if(sel && sel.rangeCount == 1) {
		range = sel.getRangeAt(0);
		caretPos = range.endOffset;
		caretNode = range.endContainer

		var elements = $('#url_pattern').contents();
		// it's the first of the two text nodes
		if(caretNode.textContent == elements[1].textContent) {
			child_node = 1;
			if(caretPos > 1) {
				child_node = 2
				caretPos = 1;
			}
		} else {
			child_node = (caretNode == elements[0]) ? 0: 2;
		}
	}
	// change the text
	var text = textbox.innerText;
	var new_code = text.replace(/\*/,'<div class="replace_target">*</div>');
	textbox.innerHTML = new_code;

	// replace the cursor
	new_range = document.createRange();
	new_range.selectNodeContents(textbox);
	new_range.setStart(textbox.childNodes[child_node], caretPos);
	new_range.setEnd(textbox.childNodes[child_node], caretPos);
	sel.removeAllRanges();
	sel.addRange(new_range);
})