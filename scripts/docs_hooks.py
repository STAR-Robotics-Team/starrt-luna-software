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

Each design doc's page lists its contributors under its header: everyone who committed to
the doc (with their Co-authored-by trailers), and, when a GitHub token is set, everyone
who reviewed or commented on a pull request that changed it. CI sets the token, so the
published site shows reviewers; a local build shows committers only.
"""

import html
import json
import logging
import os
import re
import subprocess
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

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


REPO = Path(__file__).resolve().parent.parent
# Design pages with no contributors line: the index, the template, and generated pages.
NOT_DESIGN_DOCS = {"design/README.md", "design/template.md", "design/interfaces.md",
                   "design/open-items.md", "design/performance-budgets.md", "design/end-to-end-tests.md"}
GITHUB_API = "https://api.github.com"
_cache = {}


def on_page_markdown(markdown, page, **kwargs):
    if page.file.src_uri == "README.md":
        page.meta["template"] = "home.html"
    if page.file.src_uri.startswith("design/") and page.file.src_uri not in NOT_DESIGN_DOCS:
        markdown = add_contributors(markdown, page.file.src_uri)
    return markdown


def git(*args):
    return subprocess.run(["git", "-C", str(REPO), *args], capture_output=True, text=True, check=True).stdout


def github(path):
    """One GitHub API GET, as JSON, cached for the build."""
    if path not in _cache:
        request = urllib.request.Request(f"{GITHUB_API}{path}", headers={
            "Authorization": f"Bearer {os.environ['GITHUB_TOKEN']}",
            "Accept": "application/vnd.github+json",
            "User-Agent": "starrt-luna-software docs build",
        })
        with urllib.request.urlopen(request, timeout=30) as response:
            _cache[path] = json.load(response)
    return _cache[path]


def repository():
    if os.environ.get("GITHUB_REPOSITORY"):
        return os.environ["GITHUB_REPOSITORY"]
    url = git("remote", "get-url", "origin").strip()
    return re.sub(r"^.*github\.com[:/]|\.git$", "", url)


def is_bot(login):
    return login.endswith("[bot]")


def contributors(src_uri):
    """[(name, profile URL or None)]: the doc's committers, then reviewers and commenters."""
    path = f"docs/{src_uri}"
    log_text = git("log", "--follow",
                   "--format=%H%x1f%an%x1f%ae%x1f%(trailers:key=Co-authored-by,valueonly,separator=%x1e)%x1d",
                   "--", path)
    commits, authors, names = [], [], []
    for record in filter(str.strip, log_text.split("\x1d")):
        sha, author, email, coauthors = (record.strip().split("\x1f") + ["", "", ""])[:4]
        commits.append(sha)
        authors.append((author, email))
        names.append(author)
        names += [re.sub(r"\s*<[^>]*>", "", c).strip() for c in coauthors.split("\x1e") if c.strip()]
    if not os.environ.get("GITHUB_TOKEN"):
        seen = []
        for name in names:
            if name and name not in seen and not is_bot(name):
                seen.append(name)
        return [(name, None) for name in seen]
    repo = repository()
    logins, unknown, login_of = [], [], {}
    for sha, (author, email) in zip(commits, authors):
        try:
            commit = github(f"/repos/{repo}/commits/{sha}")
        except urllib.error.HTTPError as error:
            if error.code not in (404, 422):
                raise
            unknown.append((author, email))  # not pushed yet, so GitHub does not know it
            continue
        if commit.get("author"):
            logins.append(commit["author"]["login"])
            login_of[email] = commit["author"]["login"]
        else:
            unknown.append((author, email))
        for pr in github(f"/repos/{repo}/commits/{sha}/pulls"):
            n = pr["number"]
            logins.append(pr["user"]["login"])
            logins += [r["user"]["login"] for r in github(f"/repos/{repo}/pulls/{n}/reviews?per_page=100") if r.get("user")]
            logins += [c["user"]["login"] for c in github(f"/repos/{repo}/pulls/{n}/comments?per_page=100") if c.get("user")]
            logins += [c["user"]["login"] for c in github(f"/repos/{repo}/issues/{n}/comments?per_page=100") if c.get("user")]
    people = []
    for login in dict.fromkeys(logins):
        if is_bot(login):
            continue
        try:
            user = github(f"/users/{login}")
            people.append((user.get("name") or login, f"https://github.com/{login}"))
        except urllib.error.HTTPError as error:
            if error.code != 404:
                raise
            people.append((login, None))  # a git author name, not a GitHub login
    # A commit GitHub does not know yet is matched to a login by its author's email: from
    # this doc's other commits, or from any commit of theirs in the repository.
    known = set(logins)
    rest = []
    for name, email in dict.fromkeys(unknown):
        if email not in login_of:
            found = github(f"/repos/{repo}/commits?author={urllib.parse.quote(email)}&per_page=1")
            login_of[email] = found[0]["author"]["login"] if found and found[0].get("author") else None
        if login_of[email] in known:
            continue
        if login_of[email]:
            known.add(login_of[email])
            try:
                user = github(f"/users/{login_of[email]}")
                people.append((user.get("name") or login_of[email], f"https://github.com/{login_of[email]}"))
                continue
            except urllib.error.HTTPError as error:
                if error.code != 404:
                    raise
        rest.append(name)
    shown = {name for name, _ in people}
    return people + [(name, None) for name in dict.fromkeys(rest) if name not in shown]


def add_contributors(markdown, src_uri):
    """The doc with a contributors line after its header table, or after its title."""
    try:
        people = contributors(src_uri)
    except (subprocess.CalledProcessError, OSError, ValueError, KeyError) as error:
        # In CI a missing line is a broken page, so the build fails; locally it is a note.
        report = log.warning if os.environ.get("CI") else log.info
        report("%s: could not list contributors: %s", src_uri, error)
        return markdown
    if not people:
        return markdown
    names = ", ".join(f"[{name}]({url})" if url else name for name, url in people)
    where = "" if os.environ.get("GITHUB_TOKEN") else " (committers; the published site adds reviewers)"
    line = f"**Contributors{where}:** {names}"
    lines = markdown.split("\n")
    title = next((i for i, text in enumerate(lines) if text.startswith("# ")), -1)
    at = title + 1
    while at < len(lines) and not lines[at].strip():
        at += 1
    if at < len(lines) and lines[at].startswith("|"):
        while at < len(lines) and lines[at].startswith("|"):
            at += 1
    else:
        at = title + 1
    return "\n".join(lines[:at] + ["", line, ""] + lines[at:])


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
