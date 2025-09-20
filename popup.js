function extractEmails(htmlContent) {
  let emails = [];
  // Define a regex pattern for email addresses with a global flag to find all matches
  let regex = /[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*/g;

  const foundEmails = htmlContent.match(regex);
  if (foundEmails) {
    emails = foundEmails;
  }
  return emails;
}

// This part of the script runs in the browser extension popup
if (typeof chrome !== 'undefined' && chrome.tabs) {
  chrome.tabs.executeScript(
    {
      code: "document.body.innerHTML",
    },
    function (result) {
      let emails = [];
      if (result && result[0]) {
        emails = extractEmails(result[0]);
      }
      show(emails);
    }
  );
}

function show(emails) {
  let list = document.getElementById("emails");

  // Clear any existing list items to prevent duplicates
  list.innerHTML = "";

  for (let email of emails) {
    let item = document.createElement("li");
    item.textContent = email;
    list.appendChild(item);
  }
}

// Export for testing purposes
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { extractEmails };
}
