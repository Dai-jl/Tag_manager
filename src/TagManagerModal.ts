import { Modal,App, ButtonComponent,TFile, Notice } from 'obsidian';
import Tag from './Tag';
import File from './File';

export default class TagManagerModal extends Modal{

	files:  File[];
	tags: Tag[];
	app: App;

	constructor(app: App,files: File[],tags: Tag[]){
		super(app);
		this.app = app;
		this.files = files ? files : [];
		this.tags = tags ? tags : [];
	}

	onOpen(): void {
		const {titleEl,contentEl} = this;

		titleEl.innerHTML = `给${this.files.length}个文件添加标签`
		
		contentEl.createDiv('',el => {
			el.addClass('tag-container');
			el.addClass('tag-list-container');
			this.renderItems(el,this.tags);
		})
		contentEl.createDiv('',el => {
			el.addClass('new-tag');
			let tagInput: any;
			el.createEl('input','',(input) => {
				tagInput = input;
				input.addClass('tag-input')
				input.placeholder = '输入新标签'
				input.type = 'text';
				input.addEventListener('keyup',e => {
					if(e.keyCode === 13) {
						this.addNewTag(tagInput.value);
					}
				})
			})
			new ButtonComponent(el)
				.setButtonText('添加标签')
				.onClick(() => {
					this.addNewTag(tagInput.value);
				})
		})
		contentEl.createDiv('',el => {
			el.addClass('tag-footer');
			el.createDiv('',container => {
				container.addClass('tag-button-container')
				new ButtonComponent(container)
					.setButtonText('确定')
					.onClick(() => {
						this.addTag();
					})
					.buttonEl.addClass('mod-cta');
				new ButtonComponent(container)
					.setButtonText('取消')
					.onClick(() => {
						this.close();
					})
			})
				
		})
	}

	renderItems(el: Element,tags: Tag[]){
		tags.map(tag => {
			this.renderItem(el,tag);
		})
	}

	renderItem(el: Element,tag: Tag){
		el.createDiv('',nav_file_title => {
			nav_file_title.addClass('nav-file-title');
			nav_file_title.createDiv('',nav_file_title_content => {
				nav_file_title_content.addClass('nav-file-title-content');
				nav_file_title_content.innerHTML = tag.name;
			})
			nav_file_title.addEventListener('click',this.selectElement);
		})
	}

	selectElement(e: Event){
		const el = e.target as Element;
		const isSeletced = el.classList.contains('is-selected');
		if(isSeletced) el.classList.remove('is-selected')
		else el.addClass('is-selected');
	}

	addNewTag(tagName: string){
		if(!tagName) return;
		if(this.tags.find(tag => tag.name === '#' + tagName)) return;
		const tag = new Tag('#' + tagName);
		this.tags.push(tag);
		this.renderItem(this.contentEl.children[0],tag);	
	}

	addTag(){
		const tagResults =  Array.from(this.contentEl.children[0].children);
		const seletctedTags: Tag[] = [];
		tagResults.forEach(tagName => {
			if(tagName.classList.contains('is-selected')){
				const tagNameStr = tagName.children[0].innerHTML;
				const tag = this.tags.find(tag => tag.name === tagNameStr);
				if(tag) seletctedTags.push(tag);
			}
		})
		if(seletctedTags.length === 0){
			new Notice('请至少选择一个标签！');
			return;
		}
		
		const body = this.contentEl.childNodes[0];
		const input = this.contentEl.childNodes[1];
		this.contentEl.removeChild(body);
		this.contentEl.removeChild(input);
		const footer = this.contentEl.children[0];
		footer.empty();

		new ButtonComponent(footer as HTMLElement)
			.setButtonText('取消')
			.onClick(() => {
				this.close();
			})
			.buttonEl.addClass('mod-warning');

		let progressEl: any;
		footer.createDiv('',container => {
			container.addClass('progress-container');
			container.createDiv('',progress => {
				progressEl = progress;
				progress.addClass('progress');
			})
		})

		let rate = 0;
		let percentUnit = 1 / this.files.length;

		function goAhead(){
			rate += percentUnit;
			progressEl.style.width = `${rate}%`;
		}

		Promise.all(this.files.map(async file => {
			const tags = seletctedTags.filter(tag => !file.tags.includes(tag.name));
			if(tags.length === 0){
				goAhead();
			}else{
				await addTagToFile(file.fileMsg,tags);
				goAhead();
			}
			// return Promise.resolve();
		})).then(() => {
			this.close();
		}).catch((error) => {
			new Notice('添加标签失败！')
		})
		
	}

}

async function addTagToFile(file: TFile,tags: Tag[]){
	const template = '这是注释行';
	// const template = '';
	const templateReg = new RegExp(`/^${template}/`);
	const text = await this.app.vault.read(file);
	const textArray = text.split('\n');
	if(templateReg.test(textArray[0])){
		textArray[0] = textArray[0] + ' ' + tags.map(tag => tag.name).join(' ');
	}else{
		textArray.unshift(template+ ' ' + tags.map(tag => tag.name).join(' '));
	}
	await this.app.vault.modify(file,textArray.join('\n'));
	return;
}