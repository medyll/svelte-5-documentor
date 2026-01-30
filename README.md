
# svelte-5-documentor

> Beta module for extracting metadata from Svelte 5 components

This project was previously named **svelte_docinfo_sketch** and is now maintained as **svelte-5-documentor**.

It analyzes Svelte 5 component ASTs to extract metadata (props, exports, generics, comments), inspired by [Sveld](https://github.com/carbon-design-system/sveld) but adapted for Svelte 5 and SvelteKit. TypeScript inference is not supported; only AST analysis is performed.

Uses [`zimmerframe`](https://github.com/rich-harris/zimmerframe) for AST walking and Svelte's [`parse`](https://github.com/sveltejs/svelte/blob/6534f507ce0a39b50b851d67868a1716cca6efae/packages/svelte/src/compiler/index.js#L105) with `{modern: true}`.



## Todo

- Inferred export types (language server?)
- Support metadata extraction from `.svelte.ts` files



## Usage

Module principal : [`src/lib/documentor.ts`](./src/lib/documentor.ts)


### Exclure des fichiers avec excludePattern

Vous pouvez exclure des fichiers ou dossiers de l’analyse avec l’option `excludePattern` (tableau de patterns glob, appliqué à tous les fichiers) :

```ts
import { Svelte5Documentor } from './src/lib/documentor.ts';

const documentor = new Svelte5Documentor({
	recursive: true,
	filterExts: ['.svelte', '.svx'],
	excludePattern: ['**/node_modules/**', '**/*.test.svelte']
});
// Les fichiers dans node_modules et les fichiers .test.svelte seront ignorés
```

### Exemple : parser un fichier Svelte en Node.js

```ts
import {parse_docinfo} from './src/lib/docinfo.ts';
import {readFile} from 'fs/promises';

async function main() {
	const contents = await readFile('src/routes/Positioned.svelte', 'utf8');
	const {docinfo, ast} = parse_docinfo(contents);
	console.log(docinfo);
}

main();
```

Cela extrait les props, exports, generics, et commentaires du composant Svelte.

To get the metadata from a component:

```ts
import {parse_docinfo} from '$lib/docinfo.js;';

const docinfo = parse_docinfo(`
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
const docinfo = parse_docinfo(some_component_contents);

import {ast_to_docinfo} from '$lib/docinfo.js;';
const docinfo = ast_to_docinfo(some_modern_svelte_ast, some_component_contents);
```

Also supports named props interfaces when defined in the same file, `const {}: Props = $props();`.



Tests at [`src/tests/docinfo.test.ts`](./src/tests/docinfo.test.ts) and [`src/tests/samples`](./src/tests/samples).

```ts
// $lib/docinfo.ts

export const parse_docinfo = (
	contents: string,
	parse_options?: Parameters<typeof parse>[1], // forces `modern: true`
) => Parsed_Docinfo;

export const ast_to_docinfo: (ast: AST.Root, contents: string) => Docinfo;

export interface Parsed_Docinfo {
	docinfo: Docinfo;
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


## License

[Unlicense](license) ⚘ public domain
