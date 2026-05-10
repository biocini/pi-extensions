import type {
	ExtensionAPI,
	ExtensionContext,
} from "@mariozechner/pi-coding-agent";

interface Threshold {
	percentage: number;
	prompt: string;
}

interface LifetimeConfig {
	thresholds: Threshold[];
}

const CUSTOM_TYPE = "lifetime-config";

/**
 * lifetime — context-window threshold prompts.
 *
 * Configure thresholds (percentage + prompt). When context consumption
 * crosses a threshold, the prompt is sent as a steer message so the LLM
 * sees it before the next LLM call (or immediately after the current
 * turn if no tools are called).
 */
export default function (pi: ExtensionAPI) {
	// In-memory state for the current extension runtime
	let thresholds: Threshold[] = [];
	const fired = new Set<number>(); // percentages already triggered this cycle
	let lastPercent = 0;

	function sortThresholds() {
		thresholds.sort((a, b) => a.percentage - b.percentage);
	}

	function saveConfig() {
		pi.appendEntry(CUSTOM_TYPE, { thresholds } satisfies LifetimeConfig);
	}

	function restoreConfig(ctx: ExtensionContext) {
		const entries = ctx.sessionManager.getEntries();
		// Find the latest config entry
		for (let i = entries.length - 1; i >= 0; i--) {
			const entry = entries[i];
			if (entry.type === "custom" && entry.customType === CUSTOM_TYPE) {
				const data = entry.data as LifetimeConfig | undefined;
				if (data && Array.isArray(data.thresholds)) {
					thresholds = data.thresholds;
					sortThresholds();
				}
				return;
			}
		}
	}

	function resetFired() {
		fired.clear();
		lastPercent = 0;
	}

	function checkThresholds(ctx: ExtensionContext) {
		if (thresholds.length === 0) return;

		const usage = ctx.getContextUsage();
		if (
			!usage ||
			typeof usage.tokens !== "number" ||
			!usage.contextWindow ||
			usage.contextWindow <= 0
		)
			return;

		const percent = (usage.tokens / usage.contextWindow) * 100;

		// If context dropped significantly, assume compaction happened and reset
		if (percent < lastPercent - 5) {
			resetFired();
		}
		lastPercent = percent;

		const crossed = thresholds.filter(
			(t) => percent >= t.percentage && !fired.has(t.percentage),
		);

		for (const t of crossed) {
			fired.add(t.percentage);
			pi.sendUserMessage(t.prompt, { deliverAs: "steer" });
			ctx.ui.notify(
				`lifetime: ${t.percentage}% threshold crossed — prompt sent`,
				"info",
			);
		}
	}

	// ─── Events ───────────────────────────────────────────────────────

	pi.on("session_start", async (_event, ctx) => {
		restoreConfig(ctx);
		resetFired();
	});

	pi.on("turn_start", async (_event, ctx) => {
		checkThresholds(ctx);
	});

	pi.on("session_compact", async (_event, _ctx) => {
		resetFired();
	});

	// ─── Commands ──────────────────────────────────────────────────────

	pi.registerCommand("lifetime", {
		description: "Manage lifetime context-window threshold prompts",
		handler: async (args, ctx) => {
			const tokens = args.trim().split(/\s+/);
			const sub = tokens[0]?.toLowerCase();

			if (sub === "add") {
				const pct = parseInt(tokens[1], 10);
				const prompt = tokens.slice(2).join(" ");

				if (Number.isNaN(pct) || pct < 1 || pct > 99) {
					ctx.ui.notify("Usage: /lifetime add <1-99> <prompt>", "error");
					return;
				}
				if (!prompt) {
					ctx.ui.notify("Usage: /lifetime add <1-99> <prompt>", "error");
					return;
				}

				// Remove existing threshold at same percentage
				thresholds = thresholds.filter((t) => t.percentage !== pct);
				thresholds.push({ percentage: pct, prompt });
				sortThresholds();
				saveConfig();
				ctx.ui.notify(`Threshold added at ${pct}%`, "info");
				return;
			}

			if (sub === "remove") {
				const pct = parseInt(tokens[1], 10);
				if (Number.isNaN(pct)) {
					ctx.ui.notify("Usage: /lifetime remove <percentage>", "error");
					return;
				}
				const before = thresholds.length;
				thresholds = thresholds.filter((t) => t.percentage !== pct);
				if (thresholds.length === before) {
					ctx.ui.notify(`No threshold at ${pct}%`, "warning");
					return;
				}
				saveConfig();
				ctx.ui.notify(`Threshold at ${pct}% removed`, "info");
				return;
			}

			if (sub === "clear") {
				thresholds = [];
				resetFired();
				saveConfig();
				ctx.ui.notify("All thresholds cleared", "info");
				return;
			}

			if (sub === "list" || !sub) {
				if (thresholds.length === 0) {
					ctx.ui.notify("No thresholds configured", "info");
					return;
				}
				const lines = thresholds.map((t) => `${t.percentage}%: "${t.prompt}"`);
				ctx.ui.notify(lines.join("  |  "), "info");
				return;
			}

			ctx.ui.notify(
				"Unknown subcommand. Try: add, remove, clear, list",
				"error",
			);
		},
	});
}
