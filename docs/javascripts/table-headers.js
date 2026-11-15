// Keeps a table's header row in view while you scroll through the table, so you never have
// to scroll back up to see what a column means. It stops at the bottom of the site's top
// bar, and goes back in place once the table's top is in view again.
//
// CSS position: sticky cannot do this: the theme puts every table in a box that scrolls
// sideways, and a sticky header sticks to that box, not to the page. Moving the header row
// with a transform keeps it inside the table, so it still scrolls sideways with its table.
// The look of a floating header is in docs/stylesheets/tables.css.

(() => {
  const TABLES = ".md-typeset table:not([class])";
  let pending = false;

  function topBarBottom() {
    const bar = document.querySelector(".md-header");
    return bar ? bar.getBoundingClientRect().bottom : 0;
  }

  function place() {
    pending = false;
    const top = topBarBottom();
    for (const table of document.querySelectorAll(TABLES)) {
      const head = table.tHead;
      if (!head) continue;
      const box = table.getBoundingClientRect();
      // How far the header must move down to sit under the top bar, but never past the
      // table's last row.
      const shift = Math.min(Math.max(top - box.top, 0), box.height - head.offsetHeight);
      const floating = shift > 0;
      head.style.transform = floating ? `translateY(${shift}px)` : "";
      head.classList.toggle("table-head-floating", floating);
    }
  }

  function schedule() {
    if (!pending) {
      pending = true;
      requestAnimationFrame(place);
    }
  }

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  // The theme can swap pages without a reload; place the headers on each new page.
  if (window.document$ && window.document$.subscribe) {
    window.document$.subscribe(schedule);
  } else {
    document.addEventListener("DOMContentLoaded", schedule);
  }
})();
