# Email-Extractor

The Email Extractor extension is a productivity tool that scans the active browser tab and surfaces every email address it can find. The popup gives you a rich overview of the captured data so that you can copy, filter, or export the results in seconds.

## Features

- **Smart scanning** – Uses a robust regular expression to inspect visible text, the document title, and the URL to capture as many emails as possible.
- **Detailed insights** – Shows the total number of matches, unique email addresses, and distinct domains at a glance.
- **Instant filtering** – Narrow the list by typing any part of an email or domain in the search field.
- **One-click copy** – Copy the current (filtered) results to the clipboard for quick sharing.
- **CSV export** – Download the results, including occurrence counts and domains, for use in spreadsheets or CRMs.

## How it works

1. Install the extension in Chrome (load the folder as an unpacked extension via `chrome://extensions`).
2. Open any tab that contains email addresses.
3. Click the Email Extractor icon to run the scan.
4. Filter, copy, or export the results right from the popup.

The extension relies on the `chrome.scripting` API to execute a lightweight script inside the page. That script extracts email candidates, normalises them, and returns occurrence counts to the popup UI. No data ever leaves your machine.
