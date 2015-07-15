var MYEXT = {};
MYEXT.search_prefix = "";
MYEXT.suffixes = {};
MYEXT.targets = [];
MYEXT.default_target = 0;
MYEXT.actions = {
    "MISSING": {
        tip: function(text) {
            return "Unknown action";
        },
        act: function(text) {}
    },
    "SET_PREFIX": {
        tip: function(text) {
            return "Set prefix to <match>" + text.substring(1).trim() + "</match>";
        },
        act: function(text) {
            MYEXT.search_prefix = text.substring(1).trim();
            save_data();
        }
    },
    "CLEAR_PREFIX": {
        tip: function(text) {
            return "Clear prefix (" + MYEXT.search_prefix + ")";
        },
        act: function(text) {
            MYEXT.search_prefix = "";
            save_data();
        }
    },
    "PERFORM_SEARCH": {
        tip: function(text) {
            target = get_target(text);
            text = text.replace(new RegExp("@" + target.shortcut, "i"), "");

            var tip_text = "";
            if (MYEXT.search_prefix === "") {
                tip_text = "Search for <match>" + substitute_suffixes(text) + "</match>";
            } else {
                tip_text = "Search for <dim>" + substitute_suffixes(MYEXT.search_prefix) + "</dim> <match>" + substitute_suffixes(text) + "</match>";
            }

            if (target == MYEXT.targets[MYEXT.default_target]) {
                return tip_text;
            } else {
                return tip_text + " on <url>" + target.name + "</url>";
            }
        },
        act: function(text) {
            target = get_target(text);
            text = text.replace(new RegExp("@" + target.shortcut, "i"), "");
            if (text.match(/&$/)) {
                perform_search(MYEXT.search_prefix + " " + text.slice(0, -1), true, target, true);
            } else {
                perform_search(MYEXT.search_prefix + " " + text, false, target);
            }
        }
    },
    "PERFORM_MULTISEARCH": {
        tip: function(text) {
            target = get_target(text);
            text = text.replace(new RegExp("@" + target.shortcut, "i"), "");

            if (text.match(/^[ \|]*$/)) {
                // they've entered something like " | "
                return "Enter multiple searches separated by |";
            }
            // the regex removes any empty final terms
            var terms = text.replace(/ *\|+ *$/g, "").split("|");
            for (var t in terms) {
                terms[t] = substitute_suffixes(terms[t]).trim();
            }
            var str = "";
            if (terms.length > 1) {
                var last_term = terms.pop();
                str = terms.join("</match>, <match>");
                str += "</match> and <match>" + last_term;
            } else {
                str = terms[0];
            }

            if (target == MYEXT.targets[MYEXT.default_target]) {
                return "Perform a multisearch for <match>" + str + "</match>";
            } else {
                return "Perform a multisearch for <match>" + str + "</match> on <url>" + target.name + "</url>";
            }
        },
        act: function(text) {
            target = get_target(text);
            text = text.replace(new RegExp("@" + target.shortcut, "i"), "");

            var terms = text.split("|").reverse();
            for (var i = 0; i < terms.length; i++) {
                perform_search((MYEXT.search_prefix + " " + terms[i].trim()).trim(), true, target);
            }
        }
    },
    "PERFORM_MULTI_TARGET_SEARCH": {
        find_targets: function(text) {},
        tip: function(text) {},
        act: function(text) {}
    },
    "ADD_SUFFIX": {
        process_input: function(text) {
            var terms = text.split(">");
            var suffix = terms[0].trim();
            var keyword = terms[1].trim().replace(/!*/, "");
            return [suffix, keyword];
        },
        tip: function(text) {
            var input = this.process_input(text);
            return "Add <match>!" + input[1] + "</match> as a shortcut for <match>" + input[0] + "</match>";
        },
        act: function(text) {
            var input = this.process_input(text);

            add_suffix(input[1], input[0]);
        }
    },
    "REMOVE_SUFFIX": {
        tip: function(text) {
            return "Remove <match>!" + text.substring(1) + "</match> as a shortcut";
        },
        act: function(text) {
            remove_suffix(text.substring(1));
        }
    },
    "OPEN_OPTIONS_PAGE": {
        tip: function(text) {
            return "Open the SearchPin options. Put a \| in front to search for it directly.";
        },
        act: function(text) {
            chrome.tabs.getSelected(null, function(tab) {
                chrome.tabs.update(tab.id, {
                    url: chrome.extension.getURL('options.html')
                });
            });
        }

    }
};

function resolve_input(text) {
    var action = "";
    if (text.toLowerCase() === "options") {
        action = "OPEN_OPTIONS_PAGE";
    } else if (text.toLowerCase() === "\|options") {
        action = "PERFORM_SEARCH";
    } else if (text.indexOf("|") != -1) {
        action = "PERFORM_MULTISEARCH";
    } else if (text.indexOf(">") != -1) {
        action = "ADD_SUFFIX";
    } else if (text === "-") {
        action = "CLEAR_PREFIX";
    } else if (text.charAt(0) === "-") {
        action = "REMOVE_SUFFIX";
    } else if (text.charAt(0) === "+") {
        action = "SET_PREFIX";
    } else {
        action = "PERFORM_SEARCH";
    }
    return MYEXT.actions[action];
}

function add_suffix(keyword, suffix) {
    keyword = keyword.toLowerCase();
    if (!(keyword in MYEXT.suffixes)) {
        MYEXT.suffixes[keyword] = suffix.trim();
    }
    save_data();
}

function remove_suffix(keyword) {
    keyword = keyword.toLowerCase();
    if (keyword in MYEXT.suffixes) {
        delete MYEXT.suffixes[keyword];
    }
    save_data();
}

function substitute_suffixes(text) {
    var applicable_suffixes = [];
    var working_text = text;
    for (var s in MYEXT.suffixes) {
        if (working_text.match(new RegExp("!" + s + "\\b", "i"))) {
            applicable_suffixes.push(MYEXT.suffixes[s]);
            working_text = working_text.replace(new RegExp("!" + s + " *", "i"), "");
        }
    }
    applicable_suffixes.unshift(working_text.trim());
    return applicable_suffixes.join(" ");
}

function get_target(term) {
    for (var i in MYEXT.targets) {
        if (MYEXT.targets[i] !== null && MYEXT.targets[i] !== undefined &&
            term.match("@" + MYEXT.targets[i].shortcut)) {
            return MYEXT.targets[i];
        } else if (term.match(/^[ @]*$/)) { // @word @word
        console.log(term);
            /*
              FOR EACH TARGET THAT WE FIND AFTER THE FIRST ONE ( "@xxxxxxxx @yyyyyyy") {
                    IF IT'S NOT IN THE TARGET ARRAY
                        DO A NORMAL SEARCH
                    ELSE
                        APPLY THE GET TARGET FUNCTION ON THAT TARGET AND ADD IT TO THE SEARCH
              }
              */
        }
    }
    return MYEXT.targets[0]; // todo: make this default
}

function perform_search(term, background, target) {
    term = substitute_suffixes(term).trim();
    //"https://www.google.com/search?q="
    var url = target.url + encodeURIComponent(term);
    if (background !== true) {
        chrome.tabs.getSelected(null, function(tab) {
            chrome.tabs.update(tab.id, {
                url: url
            });
        });
    } else {
        chrome.tabs.getSelected(null, function(tab) {
            chrome.tabs.create({
                'url': url,
                'windowId': tab.windowId,
                'index': tab.index + 1,
                'openerTabId': tab.id
            }, function(tab) {});
        });
    }
}

function save_data() {
    var prefix_value = MYEXT.search_prefix;
    // Stores the prefix
    chrome.storage.sync.set({
        "saved_prefix": prefix_value,
        "suffixes": JSON.stringify(MYEXT.suffixes)
    }, function() {});
}

function load_data() {
    chrome.storage.sync.get(["saved_prefix", "suffixes"], function(items) {
        MYEXT.search_prefix = items.saved_prefix;
        if (MYEXT.search_prefix === undefined) {
            MYEXT.search_prefix = "";
        }

        if (items['suffixes'] !== undefined) {
            MYEXT.suffixes = JSON.parse(items['suffixes']);
        }
    });
}

function give_suggestions(text, suggest) {
    if ((MYEXT.search_prefix + text).trim().length > 0) {
        var xhr = new XMLHttpRequest();

        xhr.open("GET",
            "http://suggestqueries.google.com/complete/search?client=chrome&q=" +
            encodeURIComponent(MYEXT.search_prefix + " " + substitute_suffixes(text)),
            false);

        xhr.send();

        var result = JSON.parse(xhr.responseText);

        if (result[1].length > 0) {
            for (var i = 0; i < 5 && i < result[1].length; i++) {
                var r = result[1][i];
                if (MYEXT.search_prefix === "") {
                    suggest([{
                        content: r,
                        description: "<match>" + r + "</match>"
                    }]);
                } else if (r.startsWith(MYEXT.search_prefix)) {
                    var search = r.substr(MYEXT.search_prefix.length + 1);
                    suggest([{
                        content: search,
                        description: "<dim>" + MYEXT.search_prefix + "</dim> <match>" + search + "</match>"
                    }]);
                }
            }
        }
    }
}

chrome.omnibox.onInputChanged.addListener(
    function(text, suggest) {
        var desired_action = resolve_input(text);
        var tip_text = desired_action.tip(text);
        chrome.omnibox.setDefaultSuggestion({
            description: tip_text
        });

        give_suggestions(text, suggest);
    }
);

chrome.omnibox.onInputEntered.addListener(
    function(text) {
        var desired_action = resolve_input(text);
        desired_action.act(text);
    }
);

load_data();

var colorThief = new ColorThief();

function getFavicon(url, callback) {
    // use chrome to get the favicon
    var image = new Image();
    image.src = "chrome://favicon/" + url;

    /* this code works but isn't used at the moment

    // make a canvas to get the top left colour
    var canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    var context = canvas.getContext('2d')
    context.drawImage(image, 0, 0);
    var top_left = context.getImageData(0, 0, 1, 1).data;*/

    // use colorthief to get the most important colour
    image.onload = function() {
        callback(image, colorThief.getColor(image));
    };

    image.onerror = function() {
        callback("", [255, 255, 255], [255, 255, 255]);
    };
}

function save_targets(target_data) {
    chrome.storage.sync.set({
        "target_data": target_data
    }, function() {});
}

function load_targets(callback) {
    chrome.storage.sync.get("target_data", function(items) {
        //    if ('target_data' in items) {
        //      target_data = items['target_data'];
        //    } else {
        target_data = [{
                name: "Google",
                shortcut: "google",
                url: "https://www.google.com/search?q="
            }, {
                name: "Reddit",
                shortcut: "reddit",
                url: "http://www.reddit.com/r/all/search?restrict_sr=on&sort=relevance&t=all&q="
            }, {
                name: "Facebook",
                shortcut: "fb",
                url: "https://www.facebook.com/search/results/?q="
            }, {
                name: "Spotify",
                shortcut: "music",
                url: "https://play.spotify.com/search/"
            }, {
                name: "YouTube",
                shortcut: "yt",
                url: "https://www.youtube.com/results?search_query="
            }, {
                name: "Flickr",
                shortcut: "flickr",
                url: "https://www.flickr.com/search/?q="
            }, {
                name: "Twitter",
                shortcut: "twitter",
                url: "http://twitter.com/search?src=typd&lang=en&q="
            }, {
                name: "GitHub",
                shortcut: "git",
                url: "https://github.com/search?utf8=✓&q="
            }, {
                name: "StackOverflow",
                shortcut: "so",
                url: "http://stackoverflow.com/search?q="
            }, {
                name: "Bing Images",
                shortcut: "img",
                url: "https://www.bing.com/images/search?q="
            }, {
                name: "Tumblr",
                shortcut: "tumblr",
                url: "https://www.tumblr.com/search/"
            },

        ];
        //    }
        MYEXT.targets = target_data;
        callback(target_data);
    });
}

load_targets(function(x) {});
