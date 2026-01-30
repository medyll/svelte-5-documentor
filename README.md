
# svelte-5-documentor

> Module for extracting metadata from Svelte 5 components



It analyzes Svelte 5 component ASTs to extract metadata (props, exports, generics, comments), inspired by [Sveld](https://github.com/carbon-design-system/sveld) but adapted for Svelte 5 and SvelteKit. TypeScript inference is not supported; only AST analysis is performed.


 
## Usage

Module principal : [`src/lib/documentor.ts`](./src/lib/documentor.ts)


### Exclure des fichiers avec excludePattern

You can exclude files from the analysis with the `excludePattern` option (array of glob patterns, applied to all files) :

```ts
import { Svelte5Documentor } from './src/lib/documentor.ts';

const documentor = new Svelte5Documentor({
	recursive: true,
	filterExts: ['.svelte', '.svx'],
	excludePattern: ['**/node_modules/**', '**/*.test.svelte']
});

```

### Exemple : parser un fichier Svelte en Node.js

```ts
import {parse_docinfo} from './src/lib/metadata.ts';
import {readFile} from 'fs/promises';

async function main() {
	const contents = await readFile('src/routes/Positioned.svelte', 'utf8');
	const {metadata, ast} = parse_docinfo(contents);
	console.log(metadata);
}

main();
```

This extract is a `metadata` object, which contains the metadata of the component.

To get the metadata from a component:

```ts
import {parse_docinfo} from '$lib/metadata.js;';

const metadata = parse_docinfo(`
<script lang="ts" generics="T, U extends string">
	const {
		some_simple_prop,
		some_bindable_prop = $bindable('fallback'),
	}: {
		/**
		 * comments
		 * go here
		 *
		 * etc
		 */
		some_simple_prop: T;
		some_bindable_prop?: U;
	} = $props();

	export const export_with_type: Date = new Date();

  export const exported_needs_inference = 'TODO infer type for exports';
</script>
`);
/*
{
	"props": [
		{
			"name": "some_simple_prop",
			"comment": ["comments go here", "etc"],
			"type": "T",
			"optional": false,
			"bindable": false,
			"default": null
		},
		{
			"name": "some_bindable_prop",
			"comment": null,
			"type": "U",
			"optional": true,
			"bindable": true,
			"default": "'fallback'"
		}
	],
	"exports": [
		{"name": "export_with_type", "comment": null, "type": "Date"},
		{"name": "exported_needs_inference", "comment": null, "type": null}
	],
	"generics": "T, U extends string"
}
*/

import some_component_contents from '$routes/+layout.svelte?raw';
const metadata = parse_docinfo(some_component_contents);

import {ast_to_docinfo} from '$lib/metadata.js;';
const metadata = ast_to_docinfo(some_modern_svelte_ast, some_component_contents);
```

Also supports named props interfaces when defined in the same file, `const {}: Props = $props();`.



Tests at [`src/tests/metadata.test.ts`](./src/tests/metadata.test.ts) and [`src/tests/samples`](./src/tests/samples).

```ts
// $lib/metadata.ts

export const parse_docinfo = (
	contents: string,
	parse_options?: Parameters<typeof parse>[1], // forces `modern: true`
) => Parsed_Docinfo;

export const ast_to_docinfo: (ast: AST.Root, contents: string) => Docinfo;

export interface Parsed_Docinfo {
	metadata: Docinfo;
	ast: AST.Root;
}

export interface Docinfo {
	props: Docinfo_Prop[];
	exports: Docinfo_Export[];
	generics: string | null; // TODO inference?
}

export interface Docinfo_Prop {
	name: string;
	comment: string[] | null;
	type: string; // TODO might be enhanced by inference
	optional: boolean;
	bindable: boolean;
	default: null | string;
}

export interface Docinfo_Export {
	name: string;
	comment: string[] | null;
	type: string | null; // TODO needs inference
}
```


## Developer Workflows

- Install dependencies:
	```bash
	npm i
	```
- Run tests:
	```bash
	npm test
	```
- See parsed output in terminal:
	```bash
	npx gro run src/tests/print_parsed.ts
	```

 This project was previously named **svelte_docinfo_sketch** and is now maintained as **svelte-5-documentor**.


## License

[Unlicense](license) ⚘ public domain
