"""MkDocs hooks (see mkdocs.yml): give the home page its banner, fail the website build
when a list will look different on the website than on GitHub, and color text that is not
settled yet.

The home page, docs/README.md, uses the overrides/home.html template, which adds a banner
above it. Choosing the template here, instead of in the page's front matter, keeps the
page free of settings that GitHub would show as a table.

The website's Markdown reader keeps a code block or a second paragraph inside a list item
only when it is indented 4 spaces, and it needs a blank line before the next item after
one. GitHub accepts less, so the mistake is invisible there. On the website, the code
block falls out of the list and the steps restart at 1, or the next item joins the
paragraph above it. See "Lists" in docs/writing-docs.md.

Text that is not settled yet is written [TBD: ...] (not decided yet) or [TBR: ...] (written
down, not confirmed). GitHub shows it as written; the website shows it in its own color,
with a TBD or TBR tag (docs/stylesheets/unsettled.css). See "Mark what is not settled" in
docs/writing-docs.md.
"""

import html
import logging
import re

log = logging.getLogger("mkdocs.hooks.docs_hooks")

# A list item ending in ":" whose code block fell out of the list.
SPLIT = re.compile(r'<li>((?:(?!<li>).)*?):</li>\s*</[ou]l>\s*<div class="[^"]*highlight', re.S)
# A list item that joined the paragraph above it.
MERGED = re.compile(r"<p>((?:(?!</p>).)*?)\n(?:\d+\.|[-*]) (?:(?!</p>).)*</p>", re.S)

# [TBD] or [TBD: text], and the same for TBR, kept inside one paragraph, list item, or cell.
UNSETTLED = re.compile(
    r"\[(TBD|TBR)(?::\s*((?:(?!</?(?:p|li|td|th|tr|table|ul|ol|div|h[1-6]|pre|blockquote)\b)[^\]])+?))?\]"
)
# Code is shown as written, so a marker inside it stays a marker.
CODE = re.compile(r"<(pre|code)\b.*?</\1>", re.S)
MEANING = {"TBD": "To be determined: not decided yet", "TBR": "To be resolved: written down, not confirmed"}
# A bare [TBD] or [TBR] after a table column's name marks every value in that column.
TABLE = re.compile(r"<table>.*?</table>", re.S)
ROW = re.compile(r"<tr>(.*?)</tr>", re.S)
CELL = re.compile(r"(<t([hd])\b[^>]*>)(.*?)(</t\2>)", re.S)
BARE = re.compile(r'<span class="unsettled unsettled--(tbd|tbr)"[^>]*><span class="unsettled__tag">[A-Z]+</span></span>')


def words(fragment):
    text = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", fragment))).strip()
    return text if len(text) <= 80 else text[:77] + "..."


def on_page_markdown(markdown, page, **kwargs):
    if page.file.src_uri == "README.md":
        page.meta["template"] = "home.html"
    return markdown


def mark_unsettled(content, page):
    kept = []

    def hide(match):
        kept.append(match.group(0))
        return f"\0{len(kept) - 1}\0"

    def tag(match):
        kind, text = match.group(1), match.group(2)
        body = f" {text}" if text else ""
        return (
            f'<span class="unsettled unsettled--{kind.lower()}" title="{MEANING[kind]}">'
            f'<span class="unsettled__tag">{kind}</span>{body}</span>'
        )

    content = UNSETTLED.sub(tag, CODE.sub(hide, content))
    content = TABLE.sub(mark_columns, content)
    for match in re.finditer(r"\[(?:TBD|TBR)\b", content):
        log.warning(
            "%s: a %s marker is not closed in the same paragraph, list item, or table cell: %r",
            page.file.src_uri, match.group(0)[1:], words(content[match.start():match.start() + 120]),
        )
    return re.sub("\0(\\d+)\0", lambda match: kept[int(match.group(1))], content)


def mark_columns(table):
    rows = ROW.findall(table.group(0))
    if not rows:
        return table.group(0)
    marked = {}
    for i, cell in enumerate(CELL.finditer(rows[0])):
        if cell.group(2) == "h" and (bare := BARE.search(cell.group(3))):
            marked[i] = bare.group(1)
    if not marked:
        return table.group(0)

    def row(match):
        cells = list(CELL.finditer(match.group(1)))
        if not cells or cells[0].group(2) == "h":
            return match.group(0)
        out, last = [], 0
        for i, cell in enumerate(cells):
            out.append(match.group(1)[last:cell.start()])
            body = cell.group(3)
            if i in marked and body.strip() and "unsettled" not in body:
                body = f'<span class="unsettled unsettled--{marked[i]}">{body}</span>'
            out.append(cell.group(1) + body + cell.group(4))
            last = cell.end()
        out.append(match.group(1)[last:])
        return "<tr>" + "".join(out) + "</tr>"

    return ROW.sub(row, table.group(0))


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
    return mark_unsettled(content, page)
