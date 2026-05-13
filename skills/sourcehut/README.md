# sourcehut

A Pi Agent Skill for interacting with [SourceHut](https://sourcehut.org) (sr.ht)
via the [`hut`](https://git.sr.ht/~xenrox/hut) CLI.

## Installation

Copy or symlink into your skills directory:

```bash
pi install git:github.com/biocini/pi-extensions
```

Or load directly:

```bash
pi --skill /path/to/skills/sourcehut
```

## Requirements

- [`hut`](https://git.sr.ht/~xenrox/hut) CLI tool (available in nixpkgs as `pkgs.hut`)
- A SourceHut account with a personal access token

## Coverage

This skill covers the full `hut` command surface:

- **git** — repository management, ACLs, artifacts, webhooks, `git send-email` setup
- **builds** — CI build manifests, job submission, logs, artifacts, secrets
- **todo** — issue trackers, tickets, labels, assignments, status workflow
- **lists** — mailing lists, patchsets, archives, subscriptions
- **meta** — profile, SSH keys, PGP keys, audit log, OAuth tokens
- **hub** — project listings
- **paste** — code snippets
- **pages** — static site publishing
- **graphql** — direct API access for advanced queries

## Usage

The skill auto-triggers on SourceHut/sr.ht/hut keywords. Invoke explicitly with:

```
/skill:sourcehut
```
