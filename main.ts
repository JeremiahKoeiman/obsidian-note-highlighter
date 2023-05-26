import { Plugin, TFile, Vault } from "obsidian";

interface IMappedFile {
	name: string;
	path: string;
	content: string;
	matches: number;
}

export default class ObsidianTodos extends Plugin {
	// TODO: Check file content when plugin is initially loaded
	// TODO: check only affected file(s) after the file(s) are modified
	// TODO: Make width&height/color adjustible in css via settings

	private _fileExplorerContainer: HTMLElement;
	private _todoRegex = /TODO/gi;

	async onload() {
		const { vault, workspace } = this.app;
		this._fileExplorerContainer =
			workspace.getLeavesOfType("file-explorer")[0].view.containerEl;

		this.registerInterval(
			window.setInterval(async () => {
				const files = await this.getFilesWithMatchesAndContents(vault);
				files.forEach((file) => {
					const noteWrapperElement = this.geFileExplorerNoteElement(
						file.path
					);
					const todoIndicator = document.createElement("div");
					todoIndicator.classList.add(
						"obsidian-todo-note-highlighter"
					);

					if (noteWrapperElement) {
						noteWrapperElement.classList.add("relative");
						noteWrapperElement.append(todoIndicator);
					}
				});
			}, 5000)
		);
	}

	private async getFilesWithMatchesAndContents(
		vault: Vault
	): Promise<IMappedFile[]> {
		const files = vault.getMarkdownFiles();
		const mappedFiles = files.map(
			async (file: TFile): Promise<IMappedFile> => {
				const fileContent = await vault.cachedRead(file);
				return {
					name: file.name,
					path: file.path,
					content: fileContent,
					matches: this.getTodoMatches(fileContent),
				};
			}
		);

		const promises = await Promise.all(mappedFiles);
		return promises.filter(
			(mappedFile: IMappedFile) => mappedFile.matches > 0
		);
	}

	private getTodoMatches(fileContent: string): number {
		return fileContent.match(this._todoRegex)?.length || 0;
	}

	private geFileExplorerNoteElement(path: string): HTMLElement | null {
		return this._fileExplorerContainer.querySelector(
			`[data-path="${path}"]`
		);
	}

	onunload() {}
}
