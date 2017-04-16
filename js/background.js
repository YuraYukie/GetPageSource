var urls = [];
var receivedUrl = null;

var url, id;
var rightclicked = false;
var currentUrl;

// A generic onclick callback function.
function genericOnClick(info, tab) {
  url = info.linkUrl;

  getPageSource(url);
}

chrome.contextMenus.onClicked.addListener(function (info, tab) {
  if (info.linkUrl != undefined) {
    rightclicked = true;
    currentUrl = info.linkUrl;
  }
})

var id = chrome.contextMenus.create({
  "title": "Get page source of link", "contexts": ["link"],
  "onclick": genericOnClick
});


function getPageSource(url) {
  var format = "text";

  var onResponseReceived = function () {

    this.onload = this.onerror = this.ontimeout = null;
    // xhr for local files gives status 0, but actually succeeds
    var status = this.status || 200;
    if (status < 200 || status >= 300) {
      return;
    }
    // consider an empty result to be an error
    if (this.response.byteLength == 0) {
      return;
    }

    handleText(this.response);
    return;
  };

  var onErrorReceived = function () {

    this.onload = this.onerror = this.ontimeout = null;
    return;
  };

  var xhrTimeout = 30000;
  // The function specified in jsonCallback will be called with a single argument representing the JSON object
  var xhr = new XMLHttpRequest();
  try {
    xhr.open('get', url, true);
    xhr.timeout = xhrTimeout;
    xhr.onload = onResponseReceived;
    xhr.onerror = onErrorReceived;
    xhr.ontimeout = onErrorReceived;
    xhr.responseType = format;
//    xhr.setRequestHeader("Origin", "*");
    xhr.send();
  } catch (e) {
    onErrorReceived.call(xhr);
  }
}


function handleText(text) {
  console.log(text);
  if (text.startsWith("<script>")) {
    var regexr = /URL='(.*)'/i;
    var match = regexr.exec(text);
    var url = match[1];
    getPageSource(url);
  } else {
    var copyToClipboard = function (textToCopy) {
      $("body")
          .append($('<textarea name="comment" class="textToCopyInput"/>')
          .val(textToCopy))
          .find(".textToCopyInput")
          .select();
      try {
        var successful = document.execCommand('copy');
        var msg = successful ? 'successful' : 'unsuccessful';
        alert('Text copied to clipboard!');
      } catch (err) {
        window.prompt("To copy the text to clipboard: Ctrl+C, Enter", textToCopy);
      }
      $(".textToCopyInput").remove();
    }

    copyToClipboard(text);
  }
}

function getFilename(contentURL) {
  var name = contentURL.split('?')[0].split('#')[0];
  if (name) {
    name = name
        .replace(/^https?:\/\//, '')
        .replace(/[^A-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^[_\-]+/, '')
        .replace(/[_\-]+$/, '');
    name = '-' + name;
  } else {
    name = '';
  }
  return 'pagesourceof-' + name + '-' + Date.now() + '.html';
}

