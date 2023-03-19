// Create an empty array to store the email addresses
let emails = [];

// Define a regex pattern for email addresses
let regex = /[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*/;

// Get the HTML content of the current tab using chrome.tabs API
chrome.tabs.executeScript(
  {
    code: "document.body.innerHTML",
  },
  function (result) {
    // Loop through each line of the HTML content
    for (let line of result) {
      // Check if the line matches the regex pattern
      if (regex.test(line)) {
        // Extract the email address from the line
        let email = regex.exec(line)[0];
        // Add the email address to the array
        emails.push(email);
      }
    }

    // Display the array of email addresses in the popup
    show(emails);
  }
);

function show(emails) {
  let list = document.getElementById("emails");
  
for (let email of emails) {
   let item = document.createElement("li");
   item.textContent = email;
   list.appendChild(item);
}
}