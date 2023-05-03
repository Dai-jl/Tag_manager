import { TFile } from "obsidian";

export default class File{
    fileMsg: TFile;
    tags: string[];

    constructor(file: TFile){
        this.fileMsg = file;
        this.tags = [];
    }
}