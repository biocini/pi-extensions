---
name: sourcehut
description: "Interact with SourceHut (sr.ht) using the `hut` CLI. Covers git repos, builds (CI), todo trackers, mailing lists, paste, pages, meta/profile, hub projects, and direct GraphQL API access. Use for sr.ht repository management, build job submission, ticket tracking, patchset review, mailing list archives, static site publishing, and account administration."
---

# SourceHut Skill

Use the `hut` CLI to interact with SourceHut (sr.ht). Install via nix: `nix-shell -p hut` or add `pkgs.hut` to your environment.

## Setup

Initialize configuration (creates `~/.config/hut/config`):
```bash
hut init
```

The config stores your personal access token and default instance. Tokens are scoped per service (`git`, `builds`, `todo`, `lists`, `meta`, `hub`, `paste`, `pages`).

## Resource Naming

SourceHut uses `~user/name` notation for resources:
- Repository: `~user/repo`
- Tracker: `~user/tracker`
- Mailing list: `~user/list`

Many `hut` commands infer the current resource from the git directory context. Use `--repo`, `--tracker`, or `--mailing-list` flags to override.

## Git Repositories

### Clone and setup
Clone a repo and configure `git send-email`:
```bash
hut git clone ~user/repo
# or from URL:
hut git clone git@git.sr.ht:~user/repo
```

### Create and manage repos
```bash
# Create repo (prints remote URL)
hut git create my-project --description "My project"

# Create and clone immediately
hut git create my-project --clone

# Update repo settings
hut git update --description "New description" --visibility unlisted

# Set default branch
hut git update --default-branch main

# Delete repo
hut git delete --yes
```

### List and inspect
```bash
# List your repos
hut git list

# List another user's repos
hut git list ~someuser

# Show repo info
hut git show

# Open in browser
hut git show --web
```

### Artifacts
```bash
# List artifacts for current repo
hut git artifact list

# Upload artifacts (tagged by Git revision)
hut git artifact upload file.tar.gz --rev v1.0.0

# Delete artifact
hut git artifact delete <id>
```

### Access Control
```bash
# List ACL entries
hut git acl list

# Grant read-write access
hut git acl update ~collaborator --mode RW

# Grant read-only access
hut git acl update ~collaborator --mode RO

# Remove access
hut git acl delete <id>
```

### Webhooks
```bash
# List webhooks for current repo
hut git webhook list

# Create a repo webhook (e.g., on push)
hut git webhook create -e GIT_POST_RECEIVE -u https://example.com/hook

# Delete webhook
hut git webhook delete <id>

# List user-level webhooks (all repos)
hut git user-webhook list
```

## Builds (CI)

SourceHut CI uses build manifests (YAML), not GitHub Actions. Default manifest paths: `.build.yml`, `.build.yaml`, `.builds/*.yml`, `.builds/*.yaml`.

### Submit and monitor jobs
```bash
# Submit with auto-discovered manifest
hut builds submit

# Submit specific manifest
hut builds submit .build.yml

# Submit and follow logs
hut builds submit --follow

# Submit with tags and note
hut builds submit --tags "hut/test" --note "Testing new feature"

# Submit without secrets
hut builds submit --no-secrets

# Submit with specific visibility
hut builds submit --visibility public
```

### Job management
```bash
# List recent jobs
hut builds list --count 20

# Show latest job status
hut builds show

# Show specific job
hut builds show <id>

# Follow job logs live
hut builds show <id> --follow

# Cancel jobs
hut builds cancel <id1> <id2>

# Resubmit a job
hut builds resubmit <id> --follow

# SSH into a running job
hut builds ssh <id>

# Update job metadata
hut builds update <id> --tags "release" --visibility public
```

### Artifacts and secrets
```bash
# List job artifacts
hut builds artifacts <id>

# List secrets
hut builds secret list

# Share a secret with a user
hut builds secret share <secret-name> --user ~collaborator
```

### Webhooks
```bash
hut builds user-webhook list
hut builds user-webhook create -e JOB_CREATED -u https://example.com/build-hook
```

## Todo (Issue Trackers)

### Tracker management
```bash
# Create a tracker
hut todo create bugs --description "Bug tracker"

# List trackers
hut todo list

# Show tracker preferences
hut todo preferences show

# Update preferences
hut todo preferences update --notify-self true

# Subscribe/unsubscribe
hut todo subscribe ~user/tracker
hut todo unsubscribe ~user/tracker
```

### Tickets
```bash
# Create a ticket
hut todo ticket create

# Create from stdin
hut todo ticket create --stdin <<EOF
Title: Fix memory leak

Description here...
EOF

# List open tickets
hut todo ticket list

# List all tickets (including closed)
hut todo ticket list --status ""

# Filter by status
hut todo ticket list --status RESOLVED

# Show ticket details
hut todo ticket show <id>

# Open in browser
hut todo ticket show <id> --web

# Edit ticket
hut todo ticket edit <id>

# Delete ticket
hut todo ticket delete <id> --yes
```

### Ticket workflow
```bash
# Comment on a ticket
hut todo ticket comment <id> --stdin <<EOF
This is a comment.
EOF

# Resolve a ticket
hut todo ticket comment <id> --status RESOLVED

# Resolve with specific resolution
hut todo ticket comment <id> --status RESOLVED --resolution FIXED

# Update status without commenting
hut todo ticket update-status <id> --status RESOLVED --resolution FIXED
```

### Labels
```bash
# Create a label
hut todo label create bug --background "#ff0000"

# List labels
hut todo label list

# Add label to ticket
hut todo ticket label <id> --label bug

# Remove label from ticket
hut todo ticket unlabel <id> --label bug

# Update label
hut todo label update bug --name critical --background "#cc0000"

# Delete label
hut todo label delete critical
```

### Assignment
```bash
# Assign ticket
hut todo ticket assign <id> --user ~collaborator

# Unassign ticket
hut todo ticket unassign <id> --user ~collaborator
```

## Mailing Lists

### List management
```bash
# Create a mailing list
hut lists create dev --visibility public

# List mailing lists
hut lists list

# Show list info
hut lists list --count 20

# Subscribe/unsubscribe
hut lists subscribe ~user/dev
hut lists unsubscribe ~user/dev

# Show subscriptions
hut lists subscriptions
```

### Patchsets (code review)
```bash
# List proposed patchsets
hut lists patchset list

# List all patchsets (including merged)
hut lists patchset list --status ""

# Show patchset details
hut lists patchset show <id>

# Apply a patchset locally
hut lists patchset apply <id>

# Update patchset status
hut lists patchset update <id> --status MERGED
# Statuses: PROPOSED, NEEDS_REVISION, SUPERSEDED, MERGED, REJECTED
```

### Archives
```bash
# Download full archive as mbox
hut lists archive ~user/dev > archive.mbox

# Download last 7 days
hut lists archive ~user/dev --days 7 > recent.mbox
```

### Access control and webhooks
```bash
hut lists acl list
hut lists acl update ~user --mode RW
hut lists webhook list
hut lists webhook create -e PATCHSET_RECEIVED -u https://example.com/list-hook
```

## Meta (Account Management)

### Profile
```bash
# Show your profile
hut meta show

# Show another user's profile
hut meta show ~someuser

# Update profile
hut meta update --bio "Software developer" --url https://example.com
```

### Keys
```bash
# List SSH keys
hut meta ssh-key list

# Upload default SSH key
hut meta ssh-key create

# Upload specific key
hut meta ssh-key create ~/.ssh/id_ed25519.pub

# Delete SSH key
hut meta ssh-key delete <id>

# List PGP keys
hut meta pgp-key list

# Upload default PGP key
hut meta pgp-key create

# Delete PGP key
hut meta pgp-key delete <id>
```

### Security
```bash
# Show audit log
hut meta audit-log --count 50

# List OAuth tokens
hut meta oauth tokens
```

## Hub (Projects)

Hub projects aggregate resources across sr.ht services:
```bash
# List projects
hut hub list

# Show project
hut hub show ~user/project
```

## Paste

```bash
# Create paste from file
hut paste create file.rs

# Create paste from stdin
hut paste create --name "snippet.rs" --stdin < file.rs

# List pastes
hut paste list --count 20

# Show paste
hut paste show <id>

# Update visibility
hut paste update <id> --visibility public

# Delete pastes
hut paste delete <id1> <id2>
```

## Pages (Static Site Hosting)

```bash
# List sites
hut pages list

# Publish a directory
hut pages publish ./site --domain example.srht.site

# Publish a tarball
hut pages publish site.tar.gz --domain example.srht.site

# Publish from stdin
tar czf - ./site | hut pages publish --domain example.srht.site

# Update subdirectory only
hut pages publish ./blog --domain example.srht.site --subdirectory blog

# Unpublish a site
hut pages unpublish --domain example.srht.site

# ACL management
hut pages acl list --domain example.srht.site
hut pages acl update ~collaborator --publish
```

## GraphQL API Access

For operations not covered by `hut` subcommands, use `hut graphql`:

```bash
# Query user info
hut graphql meta <<EOF | jq '.me'
query {
  me { canonicalName, email }
}
EOF

# Query with variables
hut graphql git -v owner=~user <<EOF
query($owner: String!) {
  user(username: $owner) {
    repositories { results { name, description } }
  }
}
EOF
```

Services for `hut graphql`: `meta`, `git`, `hg`, `builds`, `todo`, `lists`, `hub`, `paste`, `pages`.

## Data Export and Import

```bash
# Export all account data
hut export ./backup

# Export specific service
hut export ./backup git.sr.ht

# Export specific resource
hut export ./backup todo.sr.ht/~user/tracker

# Import data
hut import ./backup
```

## Git Send-Email Workflow

SourceHut uses email-driven code review, not pull requests. The typical contribution flow:

```bash
# 1. Clone and configure send-email
hut git clone ~upstream/project
cd project
hut git setup  # configures git send-email

# 2. Make changes, commit

# 3. Send patch to mailing list
git send-email --to=~upstream/dev@lists.sr.ht HEAD^..HEAD

# 4. Track patchset via hut
hut lists patchset list
hut lists patchset show <id>

# 5. Apply reviewed patches locally
hut lists patchset apply <id>
```

## Visibility Levels

SourceHut has three visibility levels used across services:
- `public` — visible to everyone
- `unlisted` — accessible but not listed (default for pastes, builds)
- `private` — accessible only to you and ACL entries

## Common Patterns

### Work with multiple instances
SourceHut is self-hostable. To target a non-default instance, set the instance in your hut config or use environment variables. See `hut init --help` for instance configuration.
