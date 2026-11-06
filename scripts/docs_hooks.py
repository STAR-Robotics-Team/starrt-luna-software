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

Each design doc's page gets a people table under its header: its owner (the GitHub
username in the header), everyone who committed to it (with Co-authored-by trailers), and,
when a GitHub token is set, everyone who reviewed or commented on a pull request that
changed it, each with their role. CI sets the token, so the published site shows reviewers
and names; a local build shows committers only.

The end-to-end test procedures page and the performance budgets page show test runs, which
testers record in a Google Sheet, one tab per procedure. The build reads each tab's
published CSV (the [[sheet]] in docs/design/end-to-end-tests.toml) and fills in the
<!-- test-runs: ... --> markers that scripts/design writes.
"""

import csv
import html
import importlib.machinery
import importlib.util
import io
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
TEST_RUN_PAGES = {"design/end-to-end-tests.md", "design/performance-budgets.md"}
_cache = {}
_design = {}  # the registries and test runs, read once per build


def on_pre_build(config, **kwargs):
    _design.clear()


def design():
    """scripts/design as a module, and the registries it loads."""
    if "module" not in _design:
        loader = importlib.machinery.SourceFileLoader("design_registries", str(REPO / "scripts" / "design"))
        spec = importlib.util.spec_from_loader(loader.name, loader)
        module = importlib.util.module_from_spec(spec)
        loader.exec_module(module)
        problems = module.Problems()
        reg = module.load(problems)
        module.validate(problems, reg)
        if problems.errors:
            raise ValueError("the design registries do not check out: run scripts/design check")
        _design["module"], _design["reg"] = module, reg
    return _design["module"], _design["reg"]


def test_runs():
    """(runs, problems, note) from the published test-run sheet: runs and problems by
    procedure, and a note to show instead when there are none to read."""
    if "runs" in _design:
        return _design["runs"]
    module, reg = design()
    published = (reg.sheet or {}).get("published", "")
    runs, problems, note = {}, {}, ""
    if not published:
        note = ("No runs to show yet: the test-run sheet is not published "
                "[TBD: publish it and add its address to end-to-end-tests.toml].")
    else:
        try:
            for proc in reg.procedures:
                if "sheet_gid" not in proc:
                    continue
                url = f"{published}?gid={proc['sheet_gid']}&single=true&output=csv"
                request = urllib.request.Request(url, headers={"User-Agent": "starrt-luna-software docs build"})
                with urllib.request.urlopen(request, timeout=30) as response:
                    rows = list(csv.reader(io.StringIO(response.read().decode("utf-8"))))
                runs[proc["id"]], problems[proc["id"]] = module.parse_tab(reg, proc, rows)
        except (OSError, ValueError) as error:
            # In CI a page without its runs is broken, so the build fails; locally it is a note.
            report = log.warning if os.environ.get("CI") else log.info
            report("could not read the test-run sheet: %s", error)
            runs, problems = {}, {}
            note = f"No runs to show: this build could not read the test-run sheet ({error})."
    _design["runs"] = (runs, problems, note)
    return _design["runs"]


def on_page_markdown(markdown, page, **kwargs):
    if page.file.src_uri == "README.md":
        page.meta["template"] = "home.html"
    if page.file.src_uri.startswith("design/") and page.file.src_uri not in NOT_DESIGN_DOCS:
        markdown = add_contributors(markdown, page.file.src_uri)
    if page.file.src_uri in TEST_RUN_PAGES:
        module, reg = design()
        runs, problems, note = test_runs()
        markdown = module.fill_test_runs(reg, markdown, runs, problems, note)
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


class Person:
    """One person in a doc's people table, and what they did on it."""

    def __init__(self, name="", login=""):
        self.name, self.login = name, login
        self.owner = False
        self.commits = 0
        self.coauthored = 0
        self.reviewed, self.commented = set(), set()

    def cell(self):
        """The name with the username, the name alone, or the username when there is no name."""
        if self.login:
            url = f"https://github.com/{self.login}"
            return f"[{self.name}]({url}) ({self.login})" if self.name and self.name != self.login else f"[{self.login}]({url})"
        return self.name

    def roles(self):
        def prs(numbers):
            numbers = sorted(numbers)
            if len(numbers) > 3:
                return f"{len(numbers)} pull requests"
            return "PR " + ", ".join(f"#{n}" for n in numbers)
        roles = ["Owner"] if self.owner else []
        if self.commits:
            roles.append(f"Author ({self.commits} commit{'s' * (self.commits != 1)})")
        if self.coauthored:
            roles.append(f"Co-author ({self.coauthored} commit{'s' * (self.coauthored != 1)})")
        if self.reviewed:
            roles.append(f"Reviewer ({prs(self.reviewed)})")
        if self.commented - self.reviewed:
            roles.append(f"Commenter ({prs(self.commented - self.reviewed)})")
        return ", ".join(roles)


def doc_owner(markdown):
    """The GitHub username in the doc's header table, under Owner."""
    lines = markdown.split("\n")
    for i, line in enumerate(lines[:-2]):
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if "Owner" in cells and lines[i + 1].lstrip().startswith("|"):
            values = [c.strip().strip("`") for c in lines[i + 2].strip().strip("|").split("|")]
            owner = values[cells.index("Owner")] if cells.index("Owner") < len(values) else ""
            return owner if re.fullmatch(r"[A-Za-z0-9-]+", owner) else ""
    return ""


def people(src_uri, owner):
    """[Person]: the owner, then everyone who committed to the doc, then, with a GitHub
    token, everyone who reviewed or commented on a pull request that changed it."""
    path = f"docs/{src_uri}"
    log_text = git("log", "--follow",
                   "--format=%H%x1f%an%x1f%ae%x1f%(trailers:key=Co-authored-by,valueonly,separator=%x1e)%x1d",
                   "--", path)
    commits = []  # (sha, author name, author email, [co-author names])
    for record in filter(str.strip, log_text.split("\x1d")):
        sha, author, email, coauthors = (record.strip().split("\x1f") + ["", "", ""])[:4]
        names = [re.sub(r"\s*<[^>]*>", "", c).strip() for c in coauthors.split("\x1e") if c.strip()]
        commits.append((sha, author, email, names))
    found = {}

    def person(key, name="", login=""):
        if key not in found:
            found[key] = Person(name, login)
        p = found[key]
        p.name = p.name or name
        return p

    if not os.environ.get("GITHUB_TOKEN"):
        if owner:
            person(f"login:{owner}", login=owner).owner = True
        for _, author, _, coauthors in commits:
            if not is_bot(author):
                person(f"name:{author}", author).commits += 1
            for name in coauthors:
                person(f"name:{name}", name).coauthored += 1
        return list(found.values())

    repo = repository()

    def profile(login):
        try:
            return github(f"/users/{login}").get("name") or ""
        except urllib.error.HTTPError as error:
            if error.code != 404:
                raise
            return ""

    def by_login(login, git_name=""):
        p = person(f"login:{login}", login=login)
        p.name = p.name or profile(login) or git_name
        return p

    if owner:
        by_login(owner).owner = True
    login_of = {}
    for sha, author, email, coauthors in commits:
        try:
            commit = github(f"/repos/{repo}/commits/{sha}")
            login = commit["author"]["login"] if commit.get("author") else None
        except urllib.error.HTTPError as error:
            if error.code not in (404, 422):
                raise
            # Not pushed yet, so GitHub does not know it: match its author's email to a login.
            if email not in login_of:
                found_commits = github(f"/repos/{repo}/commits?author={urllib.parse.quote(email)}&per_page=1")
                login_of[email] = (found_commits[0]["author"]["login"]
                                   if found_commits and found_commits[0].get("author") else None)
            login, commit = login_of[email], None
        if login and is_bot(login):
            continue
        (by_login(login, author) if login else person(f"name:{author}", author)).commits += 1
        for name in coauthors:
            person(f"name:{name}", name).coauthored += 1
        if commit is None:
            continue
        for pr in github(f"/repos/{repo}/commits/{sha}/pulls"):
            n = pr["number"]
            for review in github(f"/repos/{repo}/pulls/{n}/reviews?per_page=100"):
                if review.get("user") and not is_bot(review["user"]["login"]):
                    by_login(review["user"]["login"]).reviewed.add(n)
            for kind in (f"/repos/{repo}/pulls/{n}/comments?per_page=100", f"/repos/{repo}/issues/{n}/comments?per_page=100"):
                for comment in github(kind):
                    if comment.get("user") and not is_bot(comment["user"]["login"]):
                        by_login(comment["user"]["login"]).commented.add(n)
    # One person under both a name and a login (an unpushed commit's git name) is merged by name.
    logins = {p.name: p for p in found.values() if p.login and p.name}
    for key, p in list(found.items()):
        if not p.login and p.name in logins:
            other = logins[p.name]
            other.commits += p.commits
            other.coauthored += p.coauthored
            del found[key]
    return list(found.values())


def add_contributors(markdown, src_uri):
    """The doc with a people table after its header table, or after its title."""
    owner = doc_owner(markdown)
    try:
        everyone = people(src_uri, owner)
    except (subprocess.CalledProcessError, OSError, ValueError, KeyError) as error:
        # In CI a missing table is a broken page, so the build fails; locally it is a note.
        report = log.warning if os.environ.get("CI") else log.info
        report("%s: could not list the people who worked on it: %s", src_uri, error)
        return markdown
    if not everyone:
        return markdown
    everyone.sort(key=lambda p: (not p.owner, -p.commits, -p.coauthored, -len(p.reviewed), (p.name or p.login).lower()))
    role = "Role" if os.environ.get("GITHUB_TOKEN") else "Role (a local build lists committers only)"
    table = [f"| Person | {role} |", "| --- | --- |"] + [f"| {p.cell()} | {p.roles()} |" for p in everyone]
    lines = markdown.split("\n")
    title = next((i for i, text in enumerate(lines) if text.startswith("# ")), -1)
    at = title + 1
    while at < len(lines) and not lines[at].strip():
        at += 1
    if at < len(lines) and lines[at].startswith("|"):
        header = at
        while at < len(lines) and lines[at].startswith("|"):
            at += 1
        # The people table names the owner, so the header table drops its Owner column.
        cells = [c.strip() for c in lines[header].strip().strip("|").split("|")]
        if "Owner" in cells:
            column = cells.index("Owner")
            for i in range(header, at):
                row = [c.strip() for c in lines[i].strip().strip("|").split("|")]
                del row[column]
                lines[i] = "| " + " | ".join(row) + " |"
    else:
        at = title + 1
    return "\n".join(lines[:at] + [""] + table + [""] + lines[at:])


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
