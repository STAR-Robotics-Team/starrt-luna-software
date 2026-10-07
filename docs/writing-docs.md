# Writing docs

How to add or change a page in these docs. The docs are written to read well on GitHub
and to publish as the documentation website without changes, so they follow a few rules.

## Write for the right reader

The docs are written at three levels:

- **The [learning guide](learn/README.md)** assumes no experience at all. Explain every
  idea from the beginning, and give the reader something to try.
- **Setup and reference pages,** such as Getting started and Everyday workflow, assume the
  reader has finished the learning guide. Link to the guide or the
  [glossary](learn/glossary.md) the first time you use a term from it, and explain any term
  it does not cover.
- **[Design docs](design/README.md)** assume a working knowledge of ROS 2 and the robot.

When you introduce a new term in any page, add it to the glossary.

## Keep docs current

Docs change in the same pull request as the code they describe. If your change affects how
to set up, build, run, or use something, update the page that says so. A reviewer should
be able to follow the docs and get the result they describe.

When something in a doc has not been tested, say so, for example with the "not tested yet"
marker in [What works where](development-environment.md#what-works-where).

## Where pages go

- **Learning guide pages** go in `docs/learn/`, listed in reading order in
  [its home page](learn/README.md).
- **Team and environment docs** go in `docs/`, one topic per page. Add every new page to
  the map in [docs/README.md](README.md).
- **Every page goes in the website's navigation,** the `nav` list in `mkdocs.yml`. The
  website build fails if a page is missing from it.
- **Design docs** go in `docs/design/`; see [Design docs](design/README.md).
- **Package docs** go in a README next to the package's code, such as
  `src/ctre_phoenix5_vendor/README.md`.
- **Folder home pages** are named `README.md`. GitHub shows them when you open the folder,
  and documentation site generators use them as the folder's index page.
- **File names** are lowercase words joined by hyphens, such as `everyday-workflow.md`.
  Do not start a file name with `_`; some site generators skip those files.

## How to write a page

- **Start with one `#` heading,** the page title, then one or two sentences on what the
  page is for and who needs it.
- **Use `##` headings for sections** that a reader can jump to, and keep heading names
  stable: other pages link to them.
- **Write for someone new.** Use short sentences and plain words, and explain a term the
  first time you use it.
- **Show commands in fenced code blocks** with a language, such as `bash`, so readers can
  copy them. Say where to run them: a container terminal, or your own terminal.
- **Say what success looks like,** such as the output a command prints.
- **Use tables** for comparisons and reference lists.
- **Draw diagrams in Mermaid,** in a fenced `mermaid` code block.

## Lists

The website reads Markdown a little more strictly than GitHub does, so a list that looks
right on GitHub can break on the website: a code block falls out of its step and the
numbering restarts at 1, or the next step joins the paragraph above it. Two rules prevent
this, and GitHub shows lists written this way correctly too:

- **Indent everything after a step's first paragraph by 4 spaces,** such as a code block
  or a second paragraph. Lines that wrap the first paragraph can line up with its text.
- **Leave a blank line before the next step** when a step ends with a code block or a
  second paragraph.

````markdown
1. In the first terminal, start the talker:

    ```bash
    ros2 run demo_nodes_cpp talker
    ```

    It prints `Publishing: 'Hello World: 1'`, then 2, 3, and so on.

2. In the second terminal, start the listener.
````

If a list breaks either rule, `scripts/docs build` and the pull request check fail and
name the paragraph to fix.

## Links

- **Link between docs with relative links,** such as `[GUI tools](gui-tools.md)` or
  `[Design docs](design/README.md)`. These work on GitHub and on a docs site.
- **Name code files instead of linking them,** such as `scripts/dev` or
  `.devcontainer/Dockerfile`. A docs site publishes only the docs, so links to code files
  would break there.
- **Link to other websites with full URLs.**

## Cite sources

When a page states a fact that comes from outside the team, such as a value from a
datasheet, a rule from the competition guidebook, or a vendor's spec, cite the source down
to the page or section. Readers can then check the fact in one click, and so can the checks
below.

Cite the primary source, the maker's datasheet or the guidebook itself, whenever one covers
the fact. The [Sources](sources.md) page marks the few secondary sources, such as a
reseller's product page. If a doc disagrees with a primary source, the source wins: fix the
doc in the same pull request.

**To cite,** link to the source's entry on the [Sources](sources.md) page, and put the page
or section after the last comma of the link text:

```markdown
The controllers run at 1 Mbit/s ([Talon SRX User's Guide, p. 5](sources.md#ctre-talon-srx-guide)).
Ubuntu 24.04 is Tier 1 ([REP 2000, section "Jazzy Jalisco (May 2024 - May 2029)"](sources.md#ros-rep-2000)).
```

- **A PDF:** `p. 5` or `pp. 26-27`, using the page number your PDF viewer shows, not the
  number printed on the page. The two often differ, and only the viewer's number works in a
  link.
- **A web page:** `section "Heading"`, with the heading's exact words, or nothing after the
  title when the fact is on the page as a whole.
- **From a page in a folder,** adjust the path, such as `../sources.md#ros-rep-2000` from
  `docs/design/`.

**To add a source** that is not on the Sources page yet:

1. Add an entry to `docs/sources.toml`, copying an existing entry of the same format. The
   comments at the top of the file explain each field. Set `primary` to `true` only when
   the document comes from whoever makes the part or sets the rule.
2. For a PDF, run `scripts/sources hash` with the link to the PDF, and paste the `sha256`
   line it prints into the entry. This is the PDF's fingerprint.
3. For a web page, set `expect` to a few words the page shows, such as its title.
4. Run `scripts/sources render` to rebuild the Sources page, and commit both files.

Never add the PDF itself to the repository. Datasheets and rulebooks are their publishers'
copyrighted work, and this website is public, so the registry keeps the link and the
fingerprint instead.

**To check citations,** run these from the top folder of the repository, in the dev
container or your own terminal. They need Python 3.11 or newer.

| Command | What it checks | Runs on its own |
| --- | --- | --- |
| `scripts/sources check` | Every citation points at a registry entry, with a page for PDFs, and the Sources page is up to date | On every pull request that changes the docs |
| `scripts/sources links` | Every link still answers, every web page still shows its `expect` words, and no PDF has changed since it was read | Every Monday |
| `scripts/sources verify` | Claude reads each cited page and says whether it supports the passage that cites it | Every Monday, once the repository has an `ANTHROPIC_API_KEY` secret |

`verify` also needs `pip install -r scripts/sources-requirements.txt` and an Anthropic API
key in `ANTHROPIC_API_KEY`; `scripts/sources verify --dry-run` shows what it would send
without one. Its verdicts are a model's reading of the page, so treat them like a
reviewer's comments and check the quoted evidence before changing a doc.

When `links` reports that a PDF changed, its publisher has revised it. Reread the cited
pages, which the Sources page lists, fix any doc that no longer matches, then update the
entry's `version`, `sha256`, and `checked`.

## Preview the website

The docs are published as a website, built from `docs/` by MkDocs with the Material theme
(configured in `mkdocs.yml`). To see your changes exactly as the website will show them,
run this from the top folder of the repository, on your own computer:

```bash
scripts/docs serve
```

Then open <http://localhost:8000/starrt-luna-software/>. The preview updates each time
you save a file; press Ctrl+C in the terminal to stop it. It runs in Docker, so there is
nothing to install.

`scripts/docs build` builds the whole site the way the pull request check does, and fails
on any broken link, missing anchor, page left out of the navigation, or broken
[list](#lists). Every pull request
that changes the docs runs that check, and once it is merged into `main`, the website
updates by itself.

## Formatting to avoid

- Raw HTML. Use Markdown instead.
- GitHub-only syntax, such as `> [!NOTE]` callouts. A docs site shows them as plain
  quotes. Use a bold lead-in instead, such as "**Note:**".
