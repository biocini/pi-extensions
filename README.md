# pi-extensions

Personal suite of [Pi](https://pi.dev/) extensions, skills, and prompt templates.

## Structure

| Directory     | Purpose                                                     |
| ------------- | ----------------------------------------------------------- |
| `extensions/` | TypeScript extensions — custom tools, event hooks, commands |
| `skills/`     | Markdown skills — workflow instructions and tool/API guides |
| `prompts/`    | Reusable prompt templates with `{{variable}}` placeholders  |

## Included extensions

| Extension          | Description                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `current-model`    | Exposes the active LLM model (`get_current_model` tool + `/model-info` command)                                           |
| `resource-locator` | Discover path locations of installed Pi extensions, skills, and themes (`list_pi_resources` tool + `/ext-locate` command) |

## Usage

### Local development

Install the package into Pi in development mode:

```bash
pi install /path/to/pi-extensions
```

Or use the `--extension` (`-e`) flag to test a single extension without installing:

```bash
pi -e ./extensions/my-extension.ts
```

### Auto-discovery

Pi discovers resources automatically from the conventional directories listed above. No manifest entries are needed for files placed in these folders.

## Adding a new extension

1. Create `extensions/<name>.ts` (or `extensions/<name>/index.ts` for multi-file)
2. Export a default factory function receiving `ExtensionAPI`
3. Register tools, commands, or event handlers

## Adding a new skill

1. Create `skills/<name>/SKILL.md`
2. Add YAML frontmatter with `name` and `description`
3. Write markdown instructions in the body
