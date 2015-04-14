// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// This event is fired each time the user updates the text in the omnibox,
// as long as the extension's keyword mode is still active.

var search_prefix = "";

chrome.omnibox.onInputChanged.addListener(
  function(text, suggest) {
    console.log('inputChanged: ' + text);
    suggest([
      {content: search_prefix +" " + text, description: "Your search term is " + text}
    ]);
  });

// This event is fired with the user accepts the input in the omnibox.
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
