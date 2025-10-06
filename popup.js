const state = {
  entries: [],
  filteredEntries: [],
  totalMatches: 0,
  filterValue: "",
};

document.addEventListener("DOMContentLoaded", async () => {
  const filterInput = document.getElementById("filter");
  const copyButton = document.getElementById("copy");
  const exportButton = document.getElementById("export");

  filterInput.addEventListener("input", (event) => {
    applyFilter(event.target.value);
    renderTable();
  });

  copyButton.addEventListener("click", async () => {
    await copyAll();
  });

  exportButton.addEventListener("click", () => {
    exportCsv();
  });

  if (typeof chrome === "undefined" || !chrome.tabs || !chrome.scripting) {
    useDemoData();
    return;
  }

  try {
    const { entries, totalMatches } = await fetchEmailsFromPage();
    state.entries = entries;
    state.filteredEntries = entries;
    state.totalMatches = totalMatches;

    updateStats();
    renderTable();
    toggleButtons(entries.length > 0);
  } catch (error) {
    console.error("Email extraction failed", error);
    showErrorMessage(error.message || "Unable to extract emails from this page.");
  }
});

function toggleButtons(enabled) {
  document.getElementById("copy").disabled = !enabled;
  document.getElementById("export").disabled = !enabled;
}

async function fetchEmailsFromPage() {
  const tabs = await new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (results) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve(results);
    });
  });

  const [tab] = tabs;
  if (!tab?.id) {
    throw new Error("No active tab detected");
  }

  const injectionResults = await new Promise((resolve, reject) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        func: extractEmailsInPage,
      },
      (results) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve(results);
      }
    );
  });

  const [injectionResult] = injectionResults || [];

  if (!injectionResult) {
    throw new Error("Unable to inject email extraction script.");
  }

  const counts = injectionResult.result || {};
  const entries = Object.entries(counts)
    .map(([email, occurrences]) => ({
      email,
      occurrences,
      domain: email.split("@")[1] || "",
    }))
    .sort((a, b) => b.occurrences - a.occurrences || a.email.localeCompare(b.email));

  const totalMatches = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return { entries, totalMatches };
}

function extractEmailsInPage() {
  const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const counts = Object.create(null);

  const collectFromText = (text) => {
    if (!text) return;

    const matches = text.match(regex);
    if (!matches) return;

    for (const match of matches) {
      const normalised = match.toLowerCase();
      counts[normalised] = (counts[normalised] || 0) + 1;
    }
  };

  const walker = document.createTreeWalker(document.body || document, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    collectFromText(node.nodeValue);
  }

  const attributeCandidates = document.querySelectorAll(
    '[href*="@"], [data-email], [data-contact], [title*="@"], [alt*="@"], [value*="@"], meta[content*="@"]'
  );

  attributeCandidates.forEach((element) => {
    const attributes = [
      "href",
      "data-email",
      "data-contact",
      "title",
      "alt",
      "value",
      "content",
    ];
    attributes.forEach((attribute) => {
      if (element.hasAttribute && element.hasAttribute(attribute)) {
        collectFromText(element.getAttribute(attribute));
      }
    });
  });

  document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
    collectFromText(link.getAttribute("href"));
  });

  collectFromText(document.title);
  collectFromText(document.location.href);

  return counts;
}

function applyFilter(value) {
  const normalisedValue = value.trim().toLowerCase();
  state.filterValue = normalisedValue;
  if (!normalisedValue) {
    state.filteredEntries = state.entries;
    return;
  }

  state.filteredEntries = state.entries.filter((entry) =>
    entry.email.includes(normalisedValue) || entry.domain.includes(normalisedValue)
  );
}

function renderTable() {
  const tbody = document.getElementById("emails");
  const emptyState = document.getElementById("empty");
  tbody.textContent = "";

  if (!state.filteredEntries.length) {
    emptyState.textContent = state.filterValue
      ? "No email addresses match your filter."
      : "No email addresses were detected on this page.";
    emptyState.hidden = false;
    toggleButtons(false);
    return;
  }

  emptyState.hidden = true;
  emptyState.textContent = "";

  for (const entry of state.filteredEntries) {
    const row = document.createElement("tr");

    const emailCell = document.createElement("td");
    emailCell.textContent = entry.email;

    const occurrencesCell = document.createElement("td");
    occurrencesCell.textContent = entry.occurrences;

    const domainCell = document.createElement("td");
    domainCell.textContent = entry.domain;

    row.append(emailCell, occurrencesCell, domainCell);
    tbody.appendChild(row);
  }

  toggleButtons(true);
}

function updateStats() {
  const uniqueCount = state.entries.length;
  const domains = new Set(state.entries.map((entry) => entry.domain));

  document.getElementById("stat-total").textContent = state.totalMatches;
  document.getElementById("stat-unique").textContent = uniqueCount;
  document.getElementById("stat-domains").textContent = domains.size;
}

async function copyAll() {
  const content = state.filteredEntries.map((entry) => entry.email).join("\n");
  if (!content) return;

  try {
    await navigator.clipboard.writeText(content);
    flashButton(document.getElementById("copy"));
  } catch (error) {
    console.error("Copy failed", error);
    alert("Unable to copy to the clipboard. Please try again.");
  }
}

function exportCsv() {
  if (!state.filteredEntries.length) return;

  const header = "Email,Occurrences,Domain";
  const rows = state.filteredEntries.map((entry) =>
    [entry.email, entry.occurrences, entry.domain]
      .map((value) => `"${value.replace(/"/g, '""')}"`)
      .join(",")
  );
  const csvContent = [header, ...rows].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "emails.csv";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);

  flashButton(document.getElementById("export"));
}

function flashButton(button) {
  if (!button) return;

  button.classList.add("success");
  setTimeout(() => button.classList.remove("success"), 600);
}

function showErrorMessage(message) {
  const emptyState = document.getElementById("empty");
  emptyState.textContent = message;
  emptyState.hidden = false;
  toggleButtons(false);
}

function useDemoData() {
  state.entries = [
    { email: "hello@example.com", occurrences: 3, domain: "example.com" },
    { email: "team@acme.co", occurrences: 2, domain: "acme.co" },
    { email: "support@service.io", occurrences: 1, domain: "service.io" },
  ];
  state.filteredEntries = state.entries;
  state.totalMatches = state.entries.reduce((sum, entry) => sum + entry.occurrences, 0);
  updateStats();
  renderTable();
  const footer = document.querySelector("footer");
  if (footer) {
    footer.textContent = "Demo data shown outside of the Email Extractor extension.";
  }
}
