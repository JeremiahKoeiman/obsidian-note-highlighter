import { Plugin, TFile, Vault } from "obsidian";

interface IMappedFile {
	name: string;
	path: string;
	content: string;
	matches: number;
}

const NOTE_INDICATOR = "note-indicator";
const DATA_OBSIDIAN_TODOS_INDICATOR = "data-obsidian-todos-indicator";
const CSS_CLASS = "obsidian-todo-note-indicator";

export default class ObsidianTodos extends Plugin {
	// TODO: Make width&height/color adjustible in css via settings

	private _fileExplorerContainer: HTMLElement;
	private _todoRegex = /TODO/gi;
	private _initialLoad = true;

	async onload() {
		const { vault, workspace } = this.app;

		workspace.onLayoutReady(async () => {
			this._fileExplorerContainer =
				workspace.getLeavesOfType("file-explorer")[0]?.view.containerEl;

			await this.addIndicatorToNoteInFileExplorer(vault);
		});

		this.registerEvent(
			vault.on("modify", async (file: TFile) => {
				const mappedFile = await this.mapFileToIMappedFile(vault, file);

				if (mappedFile.matches > 0) {
					this.appendIndicatorElementToWrapper(mappedFile);
				} else {
					const indicatorToDelete = this.geFileExplorerNoteElement(
						mappedFile.path
					)?.querySelector(`.${CSS_CLASS}`);

					indicatorToDelete?.remove();
				}
			})
		);
	}

	private async addIndicatorToNoteInFileExplorer(
		vault: Vault
	): Promise<void> {
		const files = await this.getFilesWithMatchesAndContents(vault);
		files.forEach((file: IMappedFile) => {
			this.appendIndicatorElementToWrapper(file);
		});
	}

	private appendIndicatorElementToWrapper(file: IMappedFile): void {
		const noteWrapperElement = this.geFileExplorerNoteElement(file.path);
		const indicator = this.createIndicatorElement();

		if (noteWrapperElement) {
			noteWrapperElement.classList.add("relative");
			noteWrapperElement.append(indicator);
		}
	}

	private createIndicatorElement(): HTMLElement {
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
				this.mapFileToIMappedFile(vault, file)
		);

		const promises = await Promise.all(mappedFiles);
		return promises.filter(
			(mappedFile: IMappedFile) => mappedFile.matches > 0
		);
	}

	private async mapFileToIMappedFile(
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

	onunload() {}
}
