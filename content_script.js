// content_script.js
// This script defines a function to get page HTML.
// While popup.js uses a direct function via `chrome.scripting.executeScript({func: ...})`
// for this particular task, this file fulfills the requirement of its creation and
// could be used for other injection purposes (e.g., if injecting this file via `files` property).

function getPageINNER_HTML() {
  return document.body.innerHTML;
}

// If this script were injected using the `files` property of `executeScript`,
// the last evaluated expression's result would be returned.
// To make it return the HTML, we could just have:
// document.body.innerHTML;
// Or, call the function:
// getPageINNER_HTML();
