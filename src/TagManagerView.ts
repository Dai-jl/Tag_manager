import {ItemView,  WorkspaceLeaf,Menu, Notice, getAllTags,CachedMetadata } from 'obsidian';
import Tag from './Tag';
import File from './File';
import {VIEW_TYPE_TAGMANAGER} from './type';
import TagManagerModal from './TagManagerModal';
import MyPlugin from '../main'

export default class TagManagerView extends ItemView {

	icon = 'tag';
	context: MyPlugin;
	files:  File[];
	tags: Tag[];

	constructor(leaf: WorkspaceLeaf,context: MyPlugin) {
		super(leaf);
		this.context = context;
	}

	getViewType() {
		return VIEW_TYPE_TAGMANAGER;
	}

	getDisplayText() {
		return "Tag Manager";
	}

	
	initCaches(){
		const files = [...this.context.app.vault.getMarkdownFiles()];//unsupport canvas
		this.files = files.map(file => {
			return new File(file);
		})
	}

	async onOpen() {

		this.initCaches();

		const container = this.containerEl.children[1];

		//search input
		container.createDiv('',el => {
			el.addClass('search-input-container');
			let inputEl: Element;
			let searchButton: Element;
			el.createEl('input','',(el) => {
				inputEl = el;
				el.placeholder = '输入文件名...'
				el.type = 'text';
				el.addEventListener('input',() => {
					if(searchButton){
						if(el.value.length === 0) searchButton.addClass('hidden-search-button');
						else searchButton.classList.remove('hidden-search-button');
					}
					const files = this.getSuggestions(el.value)
					this.renderItems(files);
				})
			})
			el.createDiv('',search_botton => {
				searchButton = search_botton;
				search_botton.addClass('search-input-clear-button');
				searchButton.addClass('hidden-search-button');
				searchButton.addEventListener('click',e => {
					inputEl.value = '';
					inputEl.dispatchEvent(new CustomEvent('input'));
				})
			})
		})

		//result
		container.createDiv('')
		this.renderItems(this.files);

        container.addEventListener('contextmenu',(e) => {
			const menu = new Menu();
			menu.addItem((item) => {
				item
					.setTitle('添加标签')
					.setIcon('hash')
					.onClick(() => {
                        const fileResults =  Array.from(container.children[1].children);
                        const files: File[] = [];
                        fileResults.forEach(fileTitle => {
                            if(fileTitle.classList.contains('is-selected')){
                                const filePath = fileTitle.children[0].innerHTML;
                                const file = this.files.find(file => file.fileMsg.path === filePath);
                                if(file) files.push(file);
                            }
                        })
                        if(files.length === 0){
                            new Notice('请至少选择一个文件');
                            return;
                        }
						const tags = this.files.reduce((prev: Tag[],file) => {
							const metadata = this.context.app.metadataCache.getFileCache(file.fileMsg) as CachedMetadata;
							const allTags = getAllTags(metadata) || [];
							allTags.forEach(tagName => {
								let tag = prev.find(tag => tag.name === tagName);
								if(!tag){
									tag = new Tag(tagName);
									prev.push(tag);
								}
							})
							return prev;
						},[])
                        new TagManagerModal(this.app,files,tags).open();
                    })

			})
			menu.showAtMouseEvent(e);
		})

	}

	async onClose() {
		// Nothing to clean up.
	}

	renderItems(files: File[]){

		const container = this.containerEl.children[1].children[1];
		container.empty();

        files.map(file => {
            container.createDiv('',nav_file_title => {
                nav_file_title.addClass('nav-file-title');
                nav_file_title.createDiv('',nav_file_title_content => {
                    nav_file_title_content.addClass('nav-file-title-content');
                    nav_file_title_content.innerHTML = file.fileMsg.path;
                })
                nav_file_title.addEventListener('click',this.selectElement);
            })
        })
	}

	getSuggestions(query: string): File[] {
		const querys = query.split(' ');
		return this.files.filter(file => {
			for(let query of querys){
				if(file.fileMsg.path.toLowerCase().includes(query.toLowerCase())) return true;
			}
		})
	}

	selectElement(e: Event){
		const el = e.currentTarget as Element;
		const isSeletced = el.classList.contains('is-selected');
		if(isSeletced) el.classList.remove('is-selected')
		else el.addClass('is-selected');
	}
}