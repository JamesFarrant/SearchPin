var search_prefix = "";

chrome.omnibox.onInputChanged.addListener(
  function(text, suggest) {
    var tip_text = ""
    if(search_prefix == "") {
      // setting prefix
      tip_text = "Set prefix to "+text
    } else if(text == "-") {
      // clearing prefix
      tip_text = "Clear prefix"
    } else {
      // performing search
      tip_text = "Search for <dim>"+search_prefix+"</dim> <match>"+text+"</match>"
    }
    chrome.omnibox.setDefaultSuggestion({description: tip_text});
    
    console.log('inputChanged: ' + text);
    suggest([
      {content: search_prefix +" " + text, description: "Your search term is " + text}
    ]);
  });

chrome.omnibox.onInputEntered.addListener(
  function(text) {
    console.log('hi');
    if (search_prefix == "") {
        search_prefix = text;
    } else if (text == '-') {
        search_prefix = "";
    } else {
        chrome.tabs.getSelected(null, function(tab) {
                chrome.tabs.update(tab.id, {url: " https://www.google.com/search?q="+ encodeURIComponent(search_prefix) + "%20" + encodeURIComponent(text)});
            }
        )
    }
  });