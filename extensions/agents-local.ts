/**
 * AGENTS.md.local Extension
 *
 * Scans for `AGENTS.md.local` files in the project hierarchy and injects their
 * contents into the system prompt on every turn. Files are discovered by walking
 * up from the current working directory, and injected root-to-leaf so parent
 * project conventions apply before child project overrides.
 *
 * Usage:
 * 1. Copy or symlink this file to ~/.pi/agent/extensions/ or .pi/extensions/
 * 2. Create `AGENTS.md.local` in any project directory (or parent directories)
 * 3. The contents are automatically appended to the system prompt
 *
 * `AGENTS.md.local` is intended for local-only agent instructions that should
 * not be committed to version control (add it to `.gitignore`).
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/**
 * Walk up from `startDir` to root, collecting paths of all `filename` files found.
 * Returns paths in root-to-leaf order (outermost first).
 */
function collectUpward(startDir: string, filename: string): string[] {
	const found: string[] = [];
	let dir = path.resolve(startDir);

	while (true) {
		const candidate = path.join(dir, filename);
		if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
			found.push(candidate);
		}

		const parent = path.dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}

	// Reverse so root (outermost) comes first
	return found.reverse();
}

/**
 * Read a file safely, returning empty string on error.
 */
function readFileSafe(filePath: string): string {
	try {
		return fs.readFileSync(filePath, "utf-8");
	} catch {
		return "";
	}
}

export default function agentsLocalExtension(pi: ExtensionAPI) {
	let localFiles: string[] = [];
	let cwdAtDiscovery = "";

	pi.on("session_start", async (_event, ctx) => {
		cwdAtDiscovery = ctx.cwd;
		localFiles = collectUpward(ctx.cwd, "AGENTS.md.local");

		if (localFiles.length > 0) {
			const fileList = localFiles.map((f) => `  - ${f}`).join("\n");
			ctx.ui.notify(
				`AGENTS.md.local: ${localFiles.length} file(s) loaded`,
				"info",
			);
			ctx.ui.setWidget("agents-local", [
				`AGENTS.md.local sources (${localFiles.length}):`,
				fileList,
			]);
		} else {
			ctx.ui.setWidget("agents-local", undefined);
		}
	});

	pi.on("before_agent_start", async (event) => {
		if (localFiles.length === 0) {
			return;
		}

		const parts: string[] = [];
		for (const filePath of localFiles) {
			const content = readFileSafe(filePath).trim();
			if (!content) continue;
			parts.push(`<!-- ${path.relative(cwdAtDiscovery, filePath) || filePath} -->\n${content}`);
		}

		if (parts.length === 0) {
			return;
		}

		return {
			systemPrompt:
				event.systemPrompt +
				`\n\n## Local Agent Instructions (AGENTS.md.local)\n\n` +
				parts.join("\n\n---\n\n"),
		};
	});

	pi.on("session_shutdown", async (_event, ctx) => {
		ctx.ui.setWidget("agents-local", undefined);
	});
}
