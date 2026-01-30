import {parse_docinfo} from './docinfo.js';
import {readFile, readdir, stat} from 'fs/promises';
import {join, extname} from 'path';

export interface DocumentorOptions {
  paths?: string | string[]; // fichier(s) ou dossier(s) à parser
  recursive?: boolean;
  includeJSDoc?: boolean;
  includeComments?: boolean;
  includeTypes?: boolean;
  includeExports?: boolean;
  includeProps?: boolean;
  filterExts?: string[]; // extensions à parser, ex: ['.svelte', '.svx']
}

export interface DocinfoResult {
  file: string;
  docinfo: any;
}

export class Svelte5Documentor {
  options: DocumentorOptions;

  constructor(options: DocumentorOptions = {}) {
    let paths: string[] = [];
    if (options.paths) {
      if (typeof options.paths === 'string') paths = [options.paths];
      else paths = options.paths;
    }
    this.options = {
      paths,
      recursive: true,
      includeJSDoc: true,
      includeComments: true,
      includeTypes: true,
      includeExports: true,
      includeProps: true,
      filterExts: ['.svelte'],
      ...options,
      // fusionne les extensions si options.filterExts fourni
      filterExts: options.filterExts ? Array.from(new Set(['.svelte', ...options.filterExts])) : ['.svelte'],
    };
  }

  async parseFile(filePath: string): Promise<DocinfoResult> {
    const contents = await readFile(filePath, 'utf8');
    const {docinfo} = parse_docinfo(contents);
    return {file: filePath, docinfo: this.filterDocinfo(docinfo)};
  }

  async parseFiles(filePaths: string[]): Promise<DocinfoResult[]> {
    return Promise.all(filePaths.map((f) => this.parseFile(f)));
  }

  async parseDirectory(dirPath: string): Promise<DocinfoResult[]> {
    const files = await this.collectFiles(dirPath, this.options.recursive);
    return this.parseFiles(files);
  }

  async parseDirectories(dirPaths: string[]): Promise<DocinfoResult[]> {
    let allFiles: string[] = [];
    for (const dir of dirPaths) {
      const files = await this.collectFiles(dir, this.options.recursive);
      allFiles = allFiles.concat(files);
    }
    return this.parseFiles(allFiles);
  }

  private async collectFiles(dir: string, recursive: boolean): Promise<string[]> {
    let results: string[] = [];
    const entries = await readdir(dir, {withFileTypes: true});
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory() && recursive) {
        results = results.concat(await this.collectFiles(fullPath, true));
      } else if (
        entry.isFile() &&
        this.options.filterExts?.includes(extname(entry.name))
      ) {
        results.push(fullPath);
      }
    }
    return results;
  }

  private filterDocinfo(docinfo: any) {
    const {
      includeJSDoc,
      includeComments,
      includeTypes,
      includeExports,
      includeProps,
    } = this.options;
    const filtered: any = {};
    if (includeProps && docinfo.props) {
      filtered.props = docinfo.props.map((p: any) => ({
        name: p.name,
        ...(includeTypes ? {type: p.type} : {}),
        ...(includeComments ? {comment: p.comment} : {}),
        ...(p.optional !== undefined ? {optional: p.optional} : {}),
        ...(p.bindable !== undefined ? {bindable: p.bindable} : {}),
        ...(p.default !== undefined ? {default: p.default} : {}),
      }));
    }
    if (includeExports && docinfo.exports) {
      filtered.exports = docinfo.exports.map((e: any) => ({
        name: e.name,
        ...(includeTypes ? {type: e.type} : {}),
        ...(includeComments ? {comment: e.comment} : {}),
      }));
    }
    if (docinfo.generics) filtered.generics = docinfo.generics;
    return filtered;
  }
}

// Exemple d'utilisation :
// const doc = new Svelte5Documentor({recursive: false, includeTypes: true});
// doc.parseFile('src/routes/Positioned.svelte').then(console.log);
// doc.parseDirectory('src/routes').then(console.log);
