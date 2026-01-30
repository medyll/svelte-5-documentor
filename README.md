
# svelte-5-documentor

> Beta module for extracting metadata from Svelte 5 components

This project was previously named **svelte_docinfo_sketch** and is now maintained as **svelte-5-documentor**.

It analyzes Svelte 5 component ASTs to extract metadata (props, exports, generics, comments), inspired by [Sveld](https://github.com/carbon-design-system/sveld) but adapted for Svelte 5 and SvelteKit. TypeScript inference is not supported; only AST analysis is performed.


## Usage

Main module: [`src/lib/documentor.ts`](./src/lib/documentor.ts)

### Basic Example

```ts
import { Svelte5Documentor } from './src/lib/documentor.ts';

const documentor = new Svelte5Documentor({
  recursive: true,
  includeTypes: true,
  filterExts: ['.svelte', '.svx'],
  excludePattern: ['**/node_modules/**', '**/*.test.svelte']
});

// Parse a single file
documentor.parseFile('./src/components/Button.svelte')
  .then(result => {
    if (result.error) console.error(`Failed: ${result.error}`);
    else console.log('Doc:', result.docinfo);
  });

// Parse an entire directory
documentor.parseDirectory('./src/lib')
  .then(results => {
    results.forEach(res => console.log(`${res.file}:`, res.docinfo));
  });
```

### API

#### Svelte5Documentor(options)

Creates a new documentor instance. Options:

| Option           | Type                | Default   | Description |
|------------------|---------------------|-----------|-------------|
| `paths`          | string \| string[]  | `[]`      | File(s) or folder(s) to be parsed |
| `recursive`      | boolean             | `true`    | Scan subdirectories |
| `includeJSDoc`   | boolean             | `true`    | Include JSDoc annotations |
| `includeComments`| boolean             | `true`    | Include standard comments |
| `includeTypes`   | boolean             | `true`    | Include TypeScript types |
| `includeExports` | boolean             | `true`    | Include exported variables/functions |
| `includeProps`   | boolean             | `true`    | Include component props |
| `filterExts`     | string[]            | `[.svelte]` | File extensions to parse |
| `excludePattern` | string[]            | `[]`      | Glob patterns to exclude files |

#### Methods

- `parseFile(filePath: string): Promise<DocinfoResult>`
  - Parses a single file and returns its documentation info or error.

- `parseFiles(filePaths: string[]): Promise<DocinfoResult[]>`
  - Parses multiple files concurrently.

- `parseDirectory(dirPath: string): Promise<DocinfoResult[]>`
  - Scans a directory and parses all matching files (recursively if enabled).

- `parseDirectories(dirPaths: string[]): Promise<DocinfoResult[]>`
  - Scans multiple directories and parses all matching files found.


#### DocinfoResult

| Property | Type   | Description |
|----------|--------|-------------|
| `file`   | string | Path to the file |
| `docinfo`| object | Extracted documentation data (see below) |
| `error`  | string | Error message if parsing failed |

#### Structure of `res.docinfo`

The `docinfo` object contains the extracted metadata for a Svelte component. Its structure depends on the options, but typically includes:

```jsonc
{
  "props": [
    {
      "name": "propName",           // string: prop name
      "type": "string",             // string: type (if includeTypes)
      "comment": "Description...",   // string: JSDoc or comment (if includeComments)
      "optional": true,              // boolean: if the prop is optional
      "bindable": true,              // boolean: if the prop is bindable
      "default": "42"               // any: default value if present
    },
    // ...
  ],
  "exports": [
    {
      "name": "exportedName",       // string: export name
      "type": "number",             // string: type (if includeTypes)
      "comment": "Export comment"    // string: JSDoc or comment (if includeComments)
    },
    // ...
  ],
  "generics": [
    "T", "U" // string[]: generic type parameters if present
  ]
}
```

- All fields are optional and depend on the component and options.
- If a section (e.g., `props`, `exports`, `generics`) is not present in the component, it will be omitted.

See the test samples in [`tests/samples/`](./tests/samples/) for real-world examples of the output.

#### Filtering and Output

The output is filtered according to the options provided. For example, you can disable type or comment extraction by setting `includeTypes` or `includeComments` to `false`.

#### Excluding Files

You can exclude files from analysis using the `excludePattern` option (array of glob patterns, applied to all files). Example:

```ts
const documentor = new Svelte5Documentor({
  excludePattern: ['**/node_modules/**', '**/*.test.svelte']
});
```

## How It Works

- Uses Svelte's parser and `zimmerframe` to walk the AST of Svelte 5 components.
- Extracts props, exports, generics, and comments from the AST.
- No TypeScript inference: types are taken directly from AST or type annotations.
- Exclusion patterns are applied using glob, and only files with allowed extensions are parsed.

## Development

- Main logic: [`src/lib/documentor.ts`](./src/lib/documentor.ts), [`src/lib/docinfo.ts`](./src/lib/docinfo.ts)
- Test samples: [`tests/samples/`](./tests/samples/)
- Run tests: `npm run test` (uses Gro)
- Build: `npm run build`
- Type/lint check: `npm run check`

## License

Public domain / Unlicensed. Experimental use only.
