# Project skills

Claude Code loads the skills in this folder for anyone working on this repo.

- `gsap-*` — the official GSAP animation skills from GreenSock
  (https://github.com/greensock/gsap-skills, commit aed9cfd, MIT — see GSAP-SKILLS-LICENSE).
  The React and framework skills were left out: the site is plain JavaScript.
  To update, copy the folders again from that repository.
- `frontend-design`, `webapp-testing` — official Anthropic skills (https://github.com/anthropics/skills,
  commit dbd4588, Apache 2.0 — each folder has its LICENSE.txt). frontend-design guides distinctive
  visual design; webapp-testing drives the site in a Playwright browser to check it.
- `impeccable` — Impeccable 4.7.0 by Paul Bakaus (https://github.com/pbakaus/impeccable, Apache 2.0, see its
  LICENSE), with its four helper agents in `.claude/agents/`. Installed deliberately WITHOUT:
  its Claude Code hooks (no `.claude/settings.json`: nothing runs automatically on edits or at the end of a turn),
  and without its engine binary (`scripts/impeccable` would download one from GitHub on first use; don't run it
  unless you decide to). The design detector is used instead as `scripts/detect-antipatterns-browser.js`,
  the project's prebuilt in-page bundle, run inside a headless browser against the site; it makes no network
  calls of its own. No telemetry is sent (that lives in the binary).
