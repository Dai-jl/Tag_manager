import { App,getAllTags,Menu, Modal, Plugin, CachedMetadata} from 'obsidian';
import Tag from './src/Tag';
import File from './src/File';
import TagManagerView from './src/TagManagerView';
import {VIEW_TYPE_TAGMANAGER} from './src/type';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	fileCaches: File[] = [];
	tagCaches: Tag[] = [];
	test: string[] = [];


	async onload() {

		this.registerView(
			VIEW_TYPE_TAGMANAGER,
			(leaf) => new TagManagerView(leaf,this)
		);

		this.app.workspace.onLayoutReady(async () => {
			await this.activateView();
		});
		
	}

	async onunload() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_TAGMANAGER);
	}

	async activateView() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_TAGMANAGER);

		await this.app.workspace.getLeftLeaf(false).setViewState({
			type: VIEW_TYPE_TAGMANAGER,
			active: true,
		});

		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(VIEW_TYPE_TAGMANAGER)[0]
		);
	}

}





