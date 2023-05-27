export interface IMappedFile {
	name: string;
	path: string;
	content: string;
	matches: number;
}

export interface ObsidianNoteHighlighterSettings {
	highlighterSize: string;
	highlighterColor: string;
}

export const DEFAULT_SETTINGS: ObsidianNoteHighlighterSettings = {
	highlighterSize: "15",
	highlighterColor: "#ffff00",
};

export const NOTE_INDICATOR = "note-highlighter";
export const DATA_OBSIDIAN_TODOS_INDICATOR = "data-obsidian-todos-highlighter";
export const CSS_CLASS = "obsidian-todo-note-highlighter";

export function hex2rgb(hex: string): { r: number; g: number; b: number } {
	return {
		r: parseInt(hex.slice(1, 3), 16),
		g: parseInt(hex.slice(3, 5), 16),
		b: parseInt(hex.slice(5, 7), 16),
	};
}
