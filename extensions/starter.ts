import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

/**
 * Starter extension — copy this file to create a new extension.
 *
 * Lane: Replace the tool name, description, and logic, then delete this comment.
 */
export default function (pi: ExtensionAPI) {
	pi.on("session_start", async (_event, ctx) => {
		ctx.ui.notify("Starter extension loaded", "info");
	});

	pi.registerTool({
		name: "starter_tool",
		label: "Starter Tool",
		description: "A minimal example tool — replace with your own logic",
		parameters: Type.Object({
			input: Type.String({ description: "Text to process" }),
		}),
		async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
			return {
				content: [{ type: "text", text: `Received: ${params.input}` }],
				details: {},
			};
		},
	});

	pi.registerCommand("starter", {
		description: "Say hello from the starter extension",
		handler: async (_args, ctx) => {
			ctx.ui.notify("Hello from starter extension!", "info");
		},
	});
}
