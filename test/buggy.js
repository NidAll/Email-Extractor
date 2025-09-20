function extractEmails(htmlContent) {
  let emails = [];
  let regex = /[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*/;

  // The buggy logic: iterates over an array containing the single htmlContent string
  for (let line of [htmlContent]) {
    if (regex.test(line)) {
      let email = regex.exec(line)[0];
      emails.push(email);
    }
  }
  return emails;
}

module.exports = { extractEmails };
