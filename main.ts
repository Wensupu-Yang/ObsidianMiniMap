import { App, Editor, MarkdownView, Plugin, ItemView, WorkspaceLeaf } from 'obsidian';
import * as CodeMirror from 'codemirror';

export const VIEW_TYPE_MINIMAP = "minimap";

export class MinimapView extends ItemView {
    private minimapContainer: HTMLElement;
    private editor: CodeMirror.Editor;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

	public closeView() {
        this.onClose();
	}

    getViewType(): string {
        return VIEW_TYPE_MINIMAP;
    }

    getDisplayText(): string {
        return "Minimap";
    }

    getIcon(): string {
        return "dot-network";
    }

    async onOpen() {
        // Initialize the minimap here
        this.minimapContainer = this.containerEl.createDiv('obsidian-minimap-container');

        // Safely get the current editor instance
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView) {
            this.editor = activeView.editor as unknown as CodeMirror.Editor;

            // Render the minimap content
            this.renderMinimap();

            // Sync Minimap with Editor
            this.syncMinimapWithEditor();
        } else {
            // Handle the case where there's no active MarkdownView
            console.warn("No active MarkdownView found.");
        }
    }

    renderMinimap() {
        const content = this.editor.getValue();
        const lines = content.split('\n');
    
        // Clear previous content
        this.minimapContainer.empty();
    
        // Render each line as a scaled-down version
        for (let line of lines) {
            const lineDiv = this.minimapContainer.createDiv('minimap-line');
            lineDiv.textContent = line;
        }
    }

    syncMinimapWithEditor() {
        // Update the minimap content when the editor content changes
        this.editor.on("change", () => {
            this.renderMinimap();
        });

        // Sync minimap scroll position with editor scroll position
        this.editor.on("scroll", () => {
            const scrollInfo = this.editor.getScrollInfo();
            const scrollPercentage = scrollInfo.top / (scrollInfo.height - scrollInfo.clientHeight);
            this.minimapContainer.scrollTop = scrollPercentage * (this.minimapContainer.scrollHeight - this.minimapContainer.clientHeight);
        });
    }
}

export default class MinimapPlugin extends Plugin {
    async onload() {
        // Register the MinimapView
        this.registerView(
            VIEW_TYPE_MINIMAP,
            (leaf) => new MinimapView(leaf)
        );

        // Automatically activate the MinimapView on the right side
        this.activateMinimapView();
    }

    async activateMinimapView() {
        // Check if the MinimapView is already active
        const existingLeaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_MINIMAP);
        if (existingLeaves.length === 0) {
            // If not, activate it on the right side
            await this.app.workspace.getRightLeaf(false).setViewState({
                type: VIEW_TYPE_MINIMAP,
                active: true,
            });
        }
    }

    onunload() {
        // Clean up any resources or detach views if necessary
		this.app.workspace.getLeavesOfType(VIEW_TYPE_MINIMAP).forEach((leaf) => {
			if (leaf.view instanceof MinimapView) {
				leaf.view.closeView();
			}
		});
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_MINIMAP);
    }
}