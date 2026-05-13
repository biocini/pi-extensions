import type {
	ExtensionAPI,
	ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

interface ResourceItem {
	name: string;
	type: string;
}

interface ResourceGroup {
	path: string;
	source: string;
	scope: string;
	items: ResourceItem[];
}

interface SkillEntry {
	name: string;
	path: string;
	source: string;
	scope: string;
}

/**
 * resource-locator — discover and recall path locations of installed Pi extensions,
 * skills, themes, and other resources.
 */
export default function (pi: ExtensionAPI) {
	let groups: ResourceGroup[] = [];
	let skills: SkillEntry[] = [];

	function gather(ctx: ExtensionContext) {
		const map = new Map<string, ResourceGroup>();

		// Gather from registered tools
		for (const tool of pi.getAllTools()) {
			const si = tool.sourceInfo;
			const key = si.path;
			if (!map.has(key)) {
				map.set(key, {
					path: si.path,
					source: si.source,
					scope: si.scope,
					items: [],
				});
			}
			map.get(key)!.items.push({ name: tool.name, type: "tool" });
		}

		// Gather from registered commands
		for (const cmd of pi.getCommands()) {
			if (cmd.source !== "extension") continue;
			const si = cmd.sourceInfo;
			const key = si.path;
			if (!map.has(key)) {
				map.set(key, {
					path: si.path,
					source: si.source,
					scope: si.scope,
					items: [],
				});
			}
			map.get(key)!.items.push({ name: `/${cmd.name}`, type: "command" });
		}

		// Gather from themes
		if (ctx.hasUI) {
			for (const theme of ctx.ui.getAllThemes()) {
				if (!theme.path) continue;
				const key = theme.path;
				if (!map.has(key)) {
					map.set(key, {
						path: theme.path,
						source: "theme",
						scope: "user",
						items: [],
					});
				}
				map.get(key)!.items.push({ name: theme.name, type: "theme" });
			}
		}

		groups = Array.from(map.values());
	}

	pi.on("session_start", async (_event, ctx) => {
		gather(ctx);
	});

	pi.on("before_agent_start", async (event, _ctx) => {
		const loadedSkills = event.systemPromptOptions.skills;
		if (!loadedSkills) return;

		skills = loadedSkills.map((s) => ({
			name: s.name,
			path: s.sourceInfo.path,
			source: s.sourceInfo.source,
			scope: s.sourceInfo.scope,
		}));
	});

	pi.registerTool({
		name: "list_pi_resources",
		label: "List Pi Resources",
		description:
			"List discovered Pi extensions, skills, themes, and their filesystem paths. " +
			"Useful for locating the source files of installed extensions and skills.",
		promptSnippet:
			"Find the filesystem path of an installed Pi extension or skill",
		parameters: Type.Object({
			filter: Type.Optional(
				Type.String({
					description:
						"Optional name substring to filter results by extension/skill/theme name",
				}),
			),
		}),
		async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
			let filteredGroups = groups;
			let filteredSkills = skills;

			if (params.filter) {
				const f = params.filter.toLowerCase();
				filteredGroups = groups.filter(
					(g) =>
						g.path.toLowerCase().includes(f) ||
						g.items.some((i) => i.name.toLowerCase().includes(f)),
				);
				filteredSkills = skills.filter(
					(s) =>
						s.name.toLowerCase().includes(f) ||
						s.path.toLowerCase().includes(f),
				);
			}

			const lines: string[] = [""];

			if (filteredGroups.length > 0) {
				lines.push("## Extensions / Themes");
				for (const g of filteredGroups) {
					lines.push(`\n${g.path}`);
					lines.push(`  scope: ${g.scope} | source: ${g.source}`);
					for (const item of g.items) {
						lines.push(`  - [${item.type}] ${item.name}`);
					}
				}
			}

			if (filteredSkills.length > 0) {
				lines.push("\n## Skills");
				for (const s of filteredSkills) {
					lines.push(`\n${s.path}`);
					lines.push(
						`  name: ${s.name} | scope: ${s.scope} | source: ${s.source}`,
					);
				}
			}

			if (lines.length === 1) {
				lines.push("No resources match the filter.");
			}

			return {
				content: [{ type: "text", text: lines.join("\n") }],
				details: { groups: filteredGroups, skills: filteredSkills },
			};
		},
	});

	pi.registerCommand("ext-locate", {
		description: "Show path locations of discovered Pi resources",
		handler: async (args, ctx) => {
			let filteredGroups = groups;
			let filteredSkills = skills;

			const f = args.trim().toLowerCase();
			if (f) {
				filteredGroups = groups.filter(
					(g) =>
						g.path.toLowerCase().includes(f) ||
						g.items.some((i) => i.name.toLowerCase().includes(f)),
				);
				filteredSkills = skills.filter(
					(s) =>
						s.name.toLowerCase().includes(f) ||
						s.path.toLowerCase().includes(f),
				);
			}

			const items: string[] = [];

			for (const g of filteredGroups) {
				items.push(`${g.path} (${g.items.map((i) => i.name).join(", ")})`);
			}
			for (const s of filteredSkills) {
				items.push(`${s.path} (skill: ${s.name})`);
			}

			if (items.length === 0) {
				ctx.ui.notify("No resources found", "warning");
				return;
			}

			ctx.ui.notify(items.join("  |  "), "info");
		},
	});
}
