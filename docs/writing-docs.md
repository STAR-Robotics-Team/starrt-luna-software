# Writing docs

How to add or change a page in these docs. The docs are written to read well on GitHub
and to publish as a documentation site without changes, so they follow a few rules.

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

## Links

- **Link between docs with relative links,** such as `[GUI tools](gui-tools.md)` or
  `[Design docs](design/README.md)`. These work on GitHub and on a docs site.
- **Name code files instead of linking them,** such as `scripts/dev` or
  `.devcontainer/Dockerfile`. A docs site publishes only the docs, so links to code files
  would break there.
- **Link to other websites with full URLs.**

## Formatting to avoid

- Raw HTML. Use Markdown instead.
- GitHub-only syntax, such as `> [!NOTE]` callouts. A docs site shows them as plain
  quotes. Use a bold lead-in instead, such as "**Note:**".
