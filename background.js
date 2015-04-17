var search_prefix = "";

var actions = {
    "MISSING": { tip: "Unknown action" },
    "SET_PREFIX": { tip: "Set prefix to <match>%TEXT%</match>", act: function (text) {
        search_prefix = text;
        save_prefix()
    }},
    "CLEAR_PREFIX": { tip: "Clear prefix (%PREFIX%)", act: function (text) {
        search_prefix = ""
    }},
    "PERFORM_SEARCH": { tip: "Search for <dim>%PREFIX%</dim> <match>%TEXT%</match>", act: function (text) {
        perform_search(search_prefix + " "+text)
    }},
    "PERFORM_MULTISEARCH": { tip: "Perform a multisearch for <match>%TEXT%</match>", act: function (text) {
        var terms = text.split("|")
        for(var i = 0; i < terms.length; i++) {
            perform_search(search_prefix + " "+terms[i].trim(),true)
        }
    }}
};

function resolve_input(text) {
    var action = "";
    if (search_prefix === "") {
        action = "SET_PREFIX";
    } else if (text === "-") {
        action = "CLEAR_PREFIX";
    } else if(text.indexOf("|") != -1) {
        action = "PERFORM_MULTISEARCH";
    } else {
        action = "PERFORM_SEARCH";
    }
    return actions[action];
}

function parse_text(pre_text, text) {
    // this might have minor ui issues if the user has a prefix containing %TEXT%
    // probably not worth making a solution as this is very minor
    return pre_text.replace(/\%PREFIX\%/g, search_prefix).replace(/\%TEXT\%/g, text)
}

function perform_search(term, background) { //add background feature
    var url = "https://www.google.com/search?q=" + encodeURIComponent(term);
    if(background !== true) {
        chrome.tabs.getSelected(null, function (tab) {
            chrome.tabs.update(tab.id, {url: url});
        })
    } else {
        chrome.tabs.create({url:url,selected:false},function(tab){});
    }
}

function save_prefix() {
    var prefix_value = search_prefix;
    // Stores the prefix
    chrome.storage.sync.set({"saved_prefix": prefix_value}, function () {
        console.log('Set is working');
    });
}

function load_prefix() {
    chrome.storage.sync.get('saved_prefix', function (items) {
        console.log("items", items);
        console.log('Prefix set');

        search_prefix = items['saved_prefix'];
    });
}

chrome.omnibox.onInputChanged.addListener(
    function (text, suggest) {
        var desired_action = resolve_input(text);
        var tip_text = parse_text(desired_action.tip, text);
        chrome.omnibox.setDefaultSuggestion({description: tip_text});

        console.log('inputChanged: ' + text);
        suggest([
            {content: search_prefix + " " + text, description: "Your search term is " + text}
        ]);
    }
);

chrome.omnibox.onInputEntered.addListener(
    function (text) {
        var desired_action = resolve_input(text);
        desired_action.act(text);
    }
);

load_prefix();