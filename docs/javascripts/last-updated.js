// Adds how long ago each page last changed after its "Last updated" date, in the reader's
// browser, so it stays right however long ago the site was built (scripts/docs_hooks.py).
function addLastUpdatedAge() {
  for (const time of document.querySelectorAll("time.last-updated__time")) {
    if (time.dataset.aged) continue;
    const days = Math.floor((Date.now() - new Date(time.dateTime)) / 86400000);
    let ago;
    if (days < 1) ago = "today";
    else if (days < 2) ago = "yesterday";
    else if (days < 14) ago = `${days} days ago`;
    else if (days < 60) ago = `${Math.floor(days / 7)} weeks ago`;
    else if (days < 730) ago = `${Math.floor(days / 30)} months ago`;
    else ago = `${Math.floor(days / 365)} years ago`;
    time.insertAdjacentText("afterend", ` (${ago})`);
    time.dataset.aged = "1";
  }
}
// Material loads pages without a full reload (instant navigation), so run on each page.
if (typeof document$ !== "undefined") document$.subscribe(addLastUpdatedAge);
else document.addEventListener("DOMContentLoaded", addLastUpdatedAge);
