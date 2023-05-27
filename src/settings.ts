import {
	PluginSettingTab,
	App,
	Setting,
	TextComponent,
	ColorComponent,
} from "obsidian";
import ObsidianNoteHighlighter from "./main";
import { hex2rgb } from "./util";

export class ObsidianNoteHighlighterSettingTab extends PluginSettingTab {
	public plugin: ObsidianNoteHighlighter;

	constructor(app: App, plugin: ObsidianNoteHighlighter) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Note highlighter settings." });

		new Setting(containerEl)
			.setName("Size")
			.setDesc("The size of the highlighter. Max 25.")
			.addText((text: TextComponent) =>
				text
					.setPlaceholder("Enter the highlighter's size. Max 25.")
					.setValue(this.plugin.settings.highlighterSize)
					.onChange(async (value: string) => {
						this.plugin.settings.highlighterSize =
							Number(value) > 25 ? "25" : value;
						await this.plugin.saveSettings();
						this.dispatchSettingsUpdatedEvent(
							this.plugin.settings.highlighterSize,
							this.plugin.settings.highlighterColor
						);
					})
			);

		new Setting(containerEl)
			.setName("Color")
			.setDesc("The color of the highlighter")
			.addColorPicker((component: ColorComponent) => {
				const rgb = hex2rgb(this.plugin.settings.highlighterColor);
				component.setValueRgb({ r: rgb.r, g: rgb.g, b: rgb.b });

				component.onChange(async (value: string) => {
					this.plugin.settings.highlighterColor = value;
					await this.plugin.saveSettings();
					this.dispatchSettingsUpdatedEvent(
						this.plugin.settings.highlighterSize,
						this.plugin.settings.highlighterColor
					);
				});
			});
	}

	private dispatchSettingsUpdatedEvent(
		highlighterSize: string,
		highlighterColor: string
	): void {
		document.dispatchEvent(
			new CustomEvent("settings-updated", {
				detail: {
					highlighterSize,
					highlighterColor,
				},
			})
		);
	}
}
