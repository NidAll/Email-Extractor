// Create an empty array to store the email addresses
let emails = [];

// Define a regex pattern for email addresses (improved version)
let regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

// Get the HTML content and mailto links from the current tab using chrome.scripting API
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  // Ensure a tab is found
  if (!tabs || tabs.length === 0 || !tabs[0].id) {
    console.error("No active tab found or tab ID is missing.");
    show(["Error: No active tab found."]); // Display error in popup
    return;
  }
  const tabId = tabs[0].id;

  chrome.scripting.executeScript(
    {
      target: { tabId: tabId },
      func: () => {
        // Function to be executed in the content script environment
        const mailtoEmails = [];
        const links = document.querySelectorAll('a[href^="mailto:"]');
        links.forEach(link => {
          try {
            const url = new URL(link.href);
            // Remove "mailto:" prefix and any query parameters
            let email = url.pathname; 
            if (url.search) { // if there are query params like ?subject=...
                // email = email.substring(0, email.indexOf('?')); // Not strictly needed if URL.pathname handles it well
            }
            // Simple validation for email format after stripping mailto:
            // This regex is not as comprehensive as the main one but good for a quick check.
            if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(email)) {
                 mailtoEmails.push(email);
            }
          } catch (e) {
            // Handle potential errors if href is not a valid URL (though querySelector should ensure it starts with mailto:)
            console.warn("Could not parse mailto link: ", link.href, e);
          }
        });
        return {
          htmlContent: document.body.innerHTML,
          mailtoEmails: mailtoEmails
        };
      },
    },
    (injectionResults) => {
      // Check for errors during injection
      if (chrome.runtime.lastError) {
        console.error("Error injecting script: ", chrome.runtime.lastError.message);
        // Display a slightly more user-friendly prefixed error message in the popup
        show([`Could not access page content: ${chrome.runtime.lastError.message}`]); 
        return;
      }

      // Ensure results are as expected (now an object)
      if (!injectionResults || injectionResults.length === 0 || typeof injectionResults[0].result !== 'object') {
        console.error("Failed to get page data or result is not an object. Result:", injectionResults);
        show(["Error retrieving page data."]); 
        return;
      }

      const resultData = injectionResults[0].result;
      const pageContent = resultData.htmlContent;
      const mailtoEmails = resultData.mailtoEmails || [];
      
      // The 'emails' array is defined globally at the top of this script.
      // We should clear it before adding new emails from this execution.
      emails.length = 0; 
      const allFoundEmails = new Set();

      // 1. Add emails from mailto links
      mailtoEmails.forEach(email => allFoundEmails.add(email.trim()));

      // 2. Add emails from HTML content using the improved regex
      if (pageContent) {
        const globalRegex = new RegExp(regex, 'g'); // regex is the improved one defined at the top
        const matches = pageContent.matchAll(globalRegex);
        for (const match of matches) {
          allFoundEmails.add(match[0].trim());
        }
      }
      
      // Convert Set to array and assign to global 'emails'
      emails.push(...allFoundEmails);
      
      // Display the unique array of email addresses in the popup
      show(emails);
    }
  );
});

function show(emailsToShow) { 
  const list = document.getElementById("emails");
  const countElement = document.getElementById("email-count");

  if (countElement) {
    // Check if emailsToShow is actually an array of emails or an error/message string
    if (emailsToShow && emailsToShow.length > 0 && emailsToShow[0].includes('@')) {
      countElement.textContent = `Found ${emailsToShow.length} email(s)`;
    } else if (emailsToShow && emailsToShow.length > 0 && (emailsToShow[0].startsWith("Error:") || emailsToShow[0] === "No emails found." )) {
      countElement.textContent = emailsToShow[0]; // Display the error/message as count
    } else if (!emailsToShow || emailsToShow.length === 0) {
       countElement.textContent = "Found 0 emails";
    } else {
      // Fallback for unexpected cases
      countElement.textContent = `Found ${emailsToShow.length} item(s)`;
    }
  }

  if (!list) {
    console.error("Email list element 'emails' not found in popup.html.");
    return; 
  }
  list.innerHTML = ""; // Clear previous entries

  if (!emailsToShow || emailsToShow.length === 0) {
    let item = document.createElement("li");
    item.textContent = "No emails found.";
    item.className = 'message'; // Add class for styling
    list.appendChild(item);
    return;
  }
  
  // If emailsToShow contains a single message (like an error), display it
  if (emailsToShow.length === 1 && (emailsToShow[0].startsWith("Error:") || emailsToShow[0] === "No emails found." )) {
    let item = document.createElement("li");
    item.textContent = emailsToShow[0];
    item.className = 'message'; // Add class for styling
    list.appendChild(item);
    return;
  }

  for (let email of emailsToShow) {
    let item = document.createElement("li");
    item.textContent = email;
    list.appendChild(item);
  }
}

// Event listener for DOMContentLoaded to ensure elements are loaded
document.addEventListener('DOMContentLoaded', () => {
  const copyButton = document.getElementById('copy-all-button');
  if (copyButton) {
    copyButton.addEventListener('click', () => {
      if (emails && emails.length > 0) {
        // Ensure 'emails' only contains actual email strings before joining
        const validEmails = emails.filter(email => typeof email === 'string' && email.includes('@'));
        if (validEmails.length > 0) {
          navigator.clipboard.writeText(validEmails.join('\n'))
            .then(() => {
              const originalText = copyButton.textContent;
              copyButton.textContent = 'Copied!';
              setTimeout(() => {
                copyButton.textContent = originalText;
              }, 2000);
            })
            .catch(err => {
              console.error('Failed to copy emails: ', err);
              // Optionally, provide feedback to the user that copy failed
              const originalText = copyButton.textContent;
              copyButton.textContent = 'Copy Failed!';
              setTimeout(() => {
                copyButton.textContent = originalText;
              }, 2000);
            });
        } else {
          // No valid emails to copy
           const originalText = copyButton.textContent;
           copyButton.textContent = 'No Emails!';
           setTimeout(() => {
             copyButton.textContent = originalText;
           }, 2000);
        }
      } else {
        // emails array is empty or not defined
        const originalText = copyButton.textContent;
        copyButton.textContent = 'No Emails!';
        setTimeout(() => {
            copyButton.textContent = originalText;
        }, 2000);
      }
    });
  }
});
