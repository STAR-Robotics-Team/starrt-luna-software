"""MkDocs hook (see mkdocs.yml): fails the website build when a list will look different
on the website than on GitHub.

The website's Markdown reader keeps a code block or a second paragraph inside a list item
only when it is indented 4 spaces, and it needs a blank line before the next item after
one. GitHub accepts less, so the mistake is invisible there. On the website, the code
block falls out of the list and the steps restart at 1, or the next item joins the
paragraph above it. See "Lists" in docs/writing-docs.md.
"""

import html
import logging
import re

log = logging.getLogger("mkdocs.hooks.docs_hooks")

# A list item ending in ":" whose code block fell out of the list.
SPLIT = re.compile(r'<li>((?:(?!<li>).)*?):</li>\s*</[ou]l>\s*<div class="[^"]*highlight', re.S)
# A list item that joined the paragraph above it.
MERGED = re.compile(r"<p>((?:(?!</p>).)*?)\n(?:\d+\.|[-*]) (?:(?!</p>).)*</p>", re.S)


def words(fragment):
    text = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", fragment))).strip()
    return text if len(text) <= 80 else text[:77] + "..."


def on_page_content(content, page, **kwargs):
    for match in SPLIT.finditer(content):
        log.warning(
            "%s: the code block after %r fell out of its list. Indent it 4 spaces.",
            page.file.src_uri, words(match.group(1)) + ":",
        )
    for match in MERGED.finditer(content):
        log.warning(
            "%s: a list item joined the paragraph %r. Indent that paragraph 4 spaces and "
            "leave a blank line before the next item.",
            page.file.src_uri, words(match.group(1)),
        )
    return content
