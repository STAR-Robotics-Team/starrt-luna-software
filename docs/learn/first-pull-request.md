# Your first pull request

This page walks you through sending a real change to the team, from your computer to
`main`. A good first change is an improvement to these docs: a typo, a sentence that
confused you, or a step that was missing when you set up. You have just read them with
fresh eyes, which makes you the best person to fix them.

You need a working setup ([Getting started](../getting-started.md)) and Git signed in
([Git and GitHub](git-and-github.md#set-up-git-once)). Run the commands in a VS Code
terminal or your computer's own terminal, from the top folder of your clone.

## 1. Start from the latest `main`

```bash
git switch main
git pull
```

This makes sure you start from the team's newest work, not from whatever was there when
you cloned.

## 2. Make a branch

Name it after what you are changing. For docs, start the name with `docs/`; for robot
code, start it with your workstream, such as `drivetrain/`:

```bash
git switch -c docs/clarify-getting-started
```

## 3. Make your change

Open the file in VS Code, edit it, and save. Docs are written in **Markdown**, plain text
where `#` starts a heading, `**bold**` makes bold text, and `[text](page.md)` makes a link.
To see how your page will look, press Ctrl+Shift+V (Cmd+Shift+V on macOS) in VS Code to
open a preview. [Writing docs](../writing-docs.md) has the team's rules for docs.

## 4. Check what you changed

```bash
git status
git diff
```

`git status` lists the files you changed, and `git diff` shows the exact lines. Make sure
there is nothing there you did not mean to change.

## 5. Commit

```bash
git add docs/getting-started.md
git commit -m "Explain where to find the VS Code terminal"
```

Name the files you changed after `git add`. Write a message that finishes the sentence
"This commit will...".

## 6. Push

```bash
git push -u origin docs/clarify-getting-started
```

GitHub answers with a link to open a pull request, something like:

```text
remote: Create a pull request for 'docs/clarify-getting-started' on GitHub by visiting:
remote:      https://github.com/STAR-Robotics-Team/starrt-luna-software/pull/new/docs/clarify-getting-started
```

## 7. Open the pull request

Open that link, or go to the repository on GitHub and click the **Compare & pull request**
button that appears near the top. Then:

1. Give the pull request a title that says what it does.
2. Fill in the template GitHub puts in the description: what the change is, how you
   checked it, and the checklist. For a docs change, "How I tested it" can be "Checked the
   page in VS Code's Markdown preview".
3. Click **Create pull request**.

## 8. Respond to review

A teammate reviews your pull request and may leave comments or ask for changes. That is
normal, and it is how everyone learns. To update your pull request, make the changes on
the same branch, commit, and push again:

```bash
git add docs/getting-started.md
git commit -m "Shorten the terminal explanation"
git push
```

The pull request updates by itself; there is no need to open a new one.

## 9. Merge and clean up

Once a reviewer approves, the pull request is merged into `main`, and your change is part
of the robot's software. Then catch your computer up and delete the finished branch:

```bash
git switch main
git pull
git branch -d docs/clarify-getting-started
```

Git may print a warning and delete the branch anyway; that is fine. If it refuses because
the branch is "not fully merged", check the pull request on GitHub:

- If it says **Merged**, your work is safe in `main`, and you can force the delete with
  `git branch -D docs/clarify-getting-started` (capital `D`).
- If it does not, keep the branch. It holds work that is not in `main` yet, and `-D` would
  throw it away.

## Key ideas

- Every change goes through a branch and a pull request, never straight to `main`.
- Branch, change, check with `git status` and `git diff`, commit, push, open a pull
  request.
- Review is a conversation; push more commits to the same branch to update the pull
  request.

From here, [Everyday workflow](../everyday-workflow.md) covers working on robot code, and
[Contributing](../contributing.md) has the team's full rules.
