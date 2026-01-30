import { parse_docinfo } from './docinfo.js';
import { readFile, readdir } from 'fs/promises';
import { join, extname } from 'path';
import {glob} from 'glob';

/**
 * Configuration options for the Svelte5Documentor.
 */
export interface DocumentorOptions {
  /** File(s) or folder(s) to be parsed */
  paths?: string | string[];
  /** Whether to scan subdirectories */
  recursive?: boolean;
  /** Whether to include JSDoc annotations in the output */
  includeJSDoc?: boolean;
  /** Whether to include standard comments */
  includeComments?: boolean;
  /** Whether to include TypeScript types */
  includeTypes?: boolean;
  /** Whether to include exported variables/functions */
  includeExports?: boolean;
  /** Whether to include component props */
  includeProps?: boolean;
  /** File extensions to parse, e.g., ['.svelte', '.svx'] */
  filterExts?: string[];
  /** Glob patterns to exclude files (appliqué à tous les fichiers) */
  excludePattern?: string[];
}

/**
 * Result structure for a single parsed file.
 */
export interface DocinfoResult {
  /** Absolute or relative path to the file */
  file: string;
  /** Extracted documentation data */
  docinfo: any;
  /** Error message if parsing failed */
  error?: string;
}

/**
 * Service to extract documentation information from Svelte 5 files.
 */
export class Svelte5Documentor {
  options: DocumentorOptions;

  /**
   * Initializes the documentor with merged options and default extensions.
   * @param {DocumentorOptions} options Configuration for the documentor instance.
   */
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
      ...options,
    };

    this.options.filterExts = options.filterExts
      ? Array.from(new Set(['.svelte', ...options.filterExts]))
      : ['.svelte'];
  }

  /**
   * Parses a single file with error handling.
   * @param filePath Path to the file to parse.
   */
  async parseFile(filePath: string): Promise<DocinfoResult> {
    try {
      const contents = await readFile(filePath, 'utf8');
      // Déduire le nom du composant (fichier sans extension)
      const relPath = filePath.replace(process.cwd() + '/', '').replace(/\\/g, '/');
      const fileName = filePath.split(/[\\/]/).pop() || '';
      const name = fileName.replace(/\.[^.]+$/, '');
      const { docinfo } = parse_docinfo(contents, name, relPath);
      return { 
        file: filePath, 
        docinfo: this.filterDocinfo(docinfo) 
      };
    } catch (err: any) {
      return { 
        file: filePath, 
        docinfo: null, 
        error: err.message 
      };
    }
  }

  /**
   * Parses multiple files concurrently.
   * @param filePaths Array of file paths to parse.
   */
  async parseFiles(filePaths: string[]): Promise<DocinfoResult[]> {
    return Promise.all(filePaths.map((f) => this.parseFile(f)));
  }

  /**
   * Scans a directory and parses all matching files.
   * @param dirPath Path to the directory.
   */
  async parseDirectory(dirPath: string): Promise<DocinfoResult[]> {
    try {
      const files = await this.collectFiles(dirPath, this.options.recursive ?? true);
      return this.parseFiles(files);
    } catch (err: any) {
      return [{ file: dirPath, docinfo: null, error: err.message }];
    }
  }

  /**
   * Scans multiple directories and parses all matching files found.
   * @param dirPaths Array of directory paths.
   */
  async parseDirectories(dirPaths: string[]): Promise<DocinfoResult[]> {
    let allFiles: string[] = [];
    for (const dir of dirPaths) {
      try {
        const files = await this.collectFiles(dir, this.options.recursive ?? true);
        allFiles = allFiles.concat(files);
      } catch (err) {
        console.error(`Error scanning directory ${dir}:`, err);
      }
    }
    return this.parseFiles(allFiles);
  }

  /**
   * Recursively or shallowly collects file paths matching filterExts.
   * @private
   */
  private async collectFiles(dir: string, recursive: boolean): Promise<string[]> {
    let results: string[] = [];
    const entries = await readdir(dir, { withFileTypes: true });
    const excludePatterns = this.options.excludePattern ?? [];
    let excluded = new Set<string>();
    // Collect excluded files (absolute paths)
    for (const pattern of excludePatterns) {
      const matches = glob.sync(pattern, { cwd: dir, absolute: true, nodir: false });
      for (const file of matches) excluded.add(file);
    }
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (excluded.has(fullPath)) continue;
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

  /**
   * Filters the raw docinfo object based on instance options.
   * @private
   */
  private filterDocinfo(docinfo: any) {
    const {
      includeComments,
      includeTypes,
      includeExports,
      includeProps,
    } = this.options;
    
    const filtered: any = {};

    if (includeProps && docinfo.props) {
      filtered.props = docinfo.props.map((p: any) => ({
        name: p.name,
        ...(includeTypes ? { type: p.type } : {}),
        ...(includeComments ? { comment: p.comment } : {}),
        ...(p.optional !== undefined ? { optional: p.optional } : {}),
        ...(p.bindable !== undefined ? { bindable: p.bindable } : {}),
        ...(p.default !== undefined ? { default: p.default } : {}),
      }));
    }

    if (includeExports && docinfo.exports) {
      filtered.exports = docinfo.exports.map((e: any) => ({
        name: e.name,
        ...(includeTypes ? { type: e.type } : {}),
        ...(includeComments ? { comment: e.comment } : {}),
      }));
    }

    if (docinfo.generics) filtered.generics = docinfo.generics;
    
    return filtered;
  }
}

/**
 * USAGE EXAMPLE:
 *
 * const documentor = new Svelte5Documentor({
 *   recursive: true,
 *   includeTypes: true,
 *   filterExts: ['.svelte', '.svx'],
 *   excludePattern: ['**\/node_modules/**', '**\/*.test.svelte']
 * });
 *
 * // Parse a single file
 * documentor.parseFile('./src/components/Button.svelte')
 *   .then(result => {
 *     if (result.error) console.error(`Failed: ${result.error}`);
 *     else console.log('Doc:', result.docinfo);
 *   });
 *
 * // Parse an entire directory
 * documentor.parseDirectory('./src/lib')
 *   .then(results => {
 *     results.forEach(res => console.log(`${res.file}:`, res.docinfo));
 *   });
 */