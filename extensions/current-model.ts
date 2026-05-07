import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "typebox";

/**
 * current-model — exposes the active LLM model to the agent as a callable tool.
 */
export default function (pi: ExtensionAPI) {
	pi.registerTool({
		name: "get_current_model",
		label: "Get Current Model",
		description:
			"Return the currently active LLM model (id, provider, name, context window, max tokens, cost)",
		promptSnippet: "Inspect the active model identity and limits",
		parameters: Type.Object({}),
		async execute(_toolCallId, _params, _signal, _onUpdate, ctx) {
			const m = ctx.model;
			if (!m) {
				return {
					content: [{ type: "text", text: "No model is currently active." }],
					details: {},
				};
			}

			const summary = [
				`id:          ${m.id}`,
				`provider:    ${m.provider}`,
				`name:        ${m.name ?? m.id}`,
				`reasoning:   ${m.reasoning}`,
				`input:       ${m.input?.join(", ") ?? "unknown"}`,
				`context:     ${m.contextWindow?.toLocaleString() ?? "unknown"}`,
				`maxTokens:   ${m.maxTokens?.toLocaleString() ?? "unknown"}`,
				`cost/input:  ${m.cost?.input ?? "unknown"}`,
				`cost/output: ${m.cost?.output ?? "unknown"}`,
			].join("\n");

			return {
				content: [{ type: "text", text: summary }],
				details: {
					id: m.id,
					provider: m.provider,
					name: m.name,
					reasoning: m.reasoning,
					input: m.input,
					contextWindow: m.contextWindow,
					maxTokens: m.maxTokens,
					cost: m.cost,
				},
			};
		},
	});

	pi.registerCommand("model-info", {
		description: "Show the currently active model in a notification",
		handler: async (_args, ctx) => {
			const m = ctx.model;
			if (!m) {
				ctx.ui.notify("No model active", "warning");
				return;
			}
			ctx.ui.notify(`${m.provider}/${m.id}`, "info");
		},
	});
}
