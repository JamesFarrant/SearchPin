var search_prefix = "";

var actions = {
    "MISSING": { tip: function(text) {
        return "Unknown action";
    }, act: function(text) {} },
    "SET_PREFIX": {
        tip: function(text) {
            return "Set prefix to <match>"+text+"</match>"
        },
        act: function (text) {
            search_prefix = text;
            save_prefix()
        }
    },
    "CLEAR_PREFIX": {
        tip: function(text) {
            return "Clear prefix ("+search_prefix+")";
        },
        act: function (text) {
            search_prefix = ""
        }
    },
    "PERFORM_SEARCH": {
        tip: function(text) {
            return "Search for <dim>"+search_prefix+"</dim> <match>"+text+"</match>";
        },
        act: function (text) {
            perform_search(search_prefix+" "+text)
        }
    },
    "PERFORM_MULTISEARCH": { 
        tip: function(text) {
            if(text.match(/^[ \|]*$/)) {
                // they've entered something like " | "
                return "Enter multiple searches separated by |";
            }
            // the regex removes any empty final terms
            var terms = text.replace(/ *\|+ *$/g,"").split("|");
            for(var t in terms) { 
                terms[t] = terms[t].trim();
            }
            var str = "";
            if(terms.length > 1) {
                var last_term = terms.pop();
                var str = terms.join("</match>, <match>");
                str += "</match> and <match>"+last_term;
            } else {
                str = terms[0];
            }
            return "Perform a multisearch for <match>"+str+"</match>";
        }, 
        act: function (text) {
            var terms = text.split("|")
            for(var i = 0; i < terms.length; i++) {
                perform_search((search_prefix+" "+terms[i].trim()).trim(),true)
            }
        }
    }
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
        var tip_text = desired_action.tip(text);
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