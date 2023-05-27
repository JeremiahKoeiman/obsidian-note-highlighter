import { Plugin, TFile, Vault } from "obsidian";
import { ObsidianNoteHighlighterSettingTab } from "./settings";
import {
	CSS_CLASS,
	DATA_OBSIDIAN_TODOS_INDICATOR,
	DEFAULT_SETTINGS,
	IMappedFile,
	NOTE_INDICATOR,
	ObsidianNoteHighlighterSettings,
	hex2rgb,
} from "./util";

export default class ObsidianNoteHighlighter extends Plugin {
	public settings: ObsidianNoteHighlighterSettings;

	private _fileExplorerContainer: HTMLElement;
	private _todoRegex = /TODO/gi;

	public async onload() {
		const { vault, workspace } = this.app;

		await this.loadSettings();

		document.addEventListener(
			"settings-updated",
			this.applySettingsToHighlighter
		);

		workspace.onLayoutReady(async () => {
			this._fileExplorerContainer =
				workspace.getLeavesOfType("file-explorer")[0]?.view.containerEl;

			await this.addHighlighterToNoteInFileExplorer(vault);

			const rgb = hex2rgb(this.settings.highlighterColor);

			document.documentElement.style.setProperty(
				"--note-indicator-size",
				`${this.settings.highlighterSize}px`
			);
			document.documentElement.style.setProperty(
				"--note-indicator-color",
				`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
			);
		});

		this.registerEvent(
			vault.on("modify", async (file: TFile) => {
				const mappedFile = await this.mapIFileToIMappedFile(
					vault,
					file
				);

				if (mappedFile.matches > 0) {
					this.appendHighlighterElementToWrapper(mappedFile);
				} else {
					const indicatorToDelete = this.geFileExplorerNoteElement(
						mappedFile.path
					)?.querySelector(`.${CSS_CLASS}`);

					indicatorToDelete?.remove();
				}
			})
		);

		this.addSettingTab(
			new ObsidianNoteHighlighterSettingTab(this.app, this)
		);
	}

	public async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	public async saveSettings() {
		await this.saveData(this.settings);
	}

	private applySettingsToHighlighter(event: CustomEvent): void {
		const rgb = hex2rgb(event.detail.highlighterColor);

		document.documentElement.style.setProperty(
			"--note-highlighter-size",
			`${event.detail.highlighterSize}px`
		);
		document.documentElement.style.setProperty(
			"--note-highlighter-color",
			`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
		);
	}

	private async addHighlighterToNoteInFileExplorer(
		vault: Vault
	): Promise<void> {
		const files = await this.getFilesWithMatchesAndContents(vault);
		files.forEach((file: IMappedFile) => {
			this.appendHighlighterElementToWrapper(file);
		});
	}

	private appendHighlighterElementToWrapper(file: IMappedFile): void {
		const noteWrapperElement = this.geFileExplorerNoteElement(file.path);
		const indicator = this.createHighlighterElement();

		if (noteWrapperElement) {
			noteWrapperElement.classList.add("relative");
			noteWrapperElement.append(indicator);
		}
	}

	private createHighlighterElement(): HTMLElement {
		const indicator = document.createElement("div");
		indicator.setAttribute(DATA_OBSIDIAN_TODOS_INDICATOR, NOTE_INDICATOR);
		indicator.classList.add(CSS_CLASS);
		return indicator;
	}

	private async getFilesWithMatchesAndContents(
		vault: Vault
	): Promise<IMappedFile[]> {
		const files = vault.getMarkdownFiles();
		const mappedFiles = files.map(
			async (file: TFile): Promise<IMappedFile> =>
				await this.mapIFileToIMappedFile(vault, file)
		);

		const promises = await Promise.all(mappedFiles);
		return promises.filter(
			(mappedFile: IMappedFile) => mappedFile.matches > 0
		);
	}

	private async mapIFileToIMappedFile(
		vault: Vault,
		file: TFile
	): Promise<IMappedFile> {
		const fileContent = await this.getFileContent(vault, file);
		return {
			name: file.name,
			path: file.path,
			content: fileContent,
			matches: this.getTodoMatches(fileContent),
		};
	}

	private getTodoMatches(fileContent: string): number {
		return fileContent.match(this._todoRegex)?.length || 0;
	}

	private async getFileContent(vault: Vault, file: TFile): Promise<string> {
		return await vault.cachedRead(file);
	}

	private geFileExplorerNoteElement(path: string): HTMLElement | null {
		return this._fileExplorerContainer?.querySelector(
			`[data-path="${path}"]`
		);
	}

	public onunload() {
		document.removeEventListener(
			"settings-updated",
			this.applySettingsToHighlighter
		);
	}
}
