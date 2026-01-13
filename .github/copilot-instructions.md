# Copilot Instructions for svelte_docinfo_sketch

## Project Overview
- This is an experimental module for extracting metadata from Svelte 5 components, inspired by Sveld but adapted for Svelte 5 and SvelteKit.
- The main logic is in [src/lib/docinfo.ts](src/lib/docinfo.ts), which parses Svelte component ASTs using `zimmerframe` and Svelte's `parse` (with `{modern: true}`).
- The project does **not** use TypeScript inference; it only analyzes the AST, so type information is limited.
- Not published to npm; intended for experimentation and public domain use.

## Key Files & Structure
- **Metadata Extraction:**
  - [src/lib/docinfo.ts](src/lib/docinfo.ts): Core parser and data structures for extracting props, exports, generics, and comments from Svelte components.
  - [src/routes/package.ts](src/routes/package.ts): Exposes `package.json` as a typed module for use in routes.
  - [src/routes/package.gen.ts](src/routes/package.gen.ts): Re-exports Gro's package generator for typed package info.
- **Samples & Tests:**
  - [tests/samples/](tests/samples/): Contains sample Svelte components and expected AST/metadata outputs for validation.
- **Config & Build:**
  - [svelte.config.js](svelte.config.js): SvelteKit config, uses static adapter and root-absolute paths. Aliases `$routes` and `$tests`.
  - [vite.config.ts](vite.config.ts): Vite config for local development.
  - [package.json](package.json): Scripts use Gro (`gro dev`, `gro build`, `gro check`, `gro test`).
  - [tsconfig.json](tsconfig.json): TypeScript config.

## Developer Workflows
- **Build & Check:**
  - Use Gro for all major workflows:
    - `npm run dev` / `npm run start`: Local development
    - `npm run build`: Build project
    - `npm run check`: Type and lint checks
    - `npm run test`: Run tests
  - GitHub Actions ([.github/workflows/check.yml](.github/workflows/check.yml)) runs `gro check --workspace` and `gro build` on push/PR.
- **Testing:**
  - Test samples are in [tests/samples/](tests/samples/). Use `gro test` to run tests.
- **Prettier & ESLint:**
  - Prettier config is in `package.json` (uses `prettier-plugin-svelte`).
  - ESLint config is in [eslint.config.js](eslint.config.js).

## Project-Specific Patterns
- **Metadata Extraction:**
  - Props and exports are extracted from Svelte components using custom AST visitors in [docinfo.ts](src/lib/docinfo.ts).
  - Comments are parsed from JSDoc blocks and attached to props/exports.
  - Generics are extracted from `<script>` attributes.
- **TypeScript:**
  - Type information is limited; no inference from TypeScript compiler.
  - Types for props/exports are taken directly from AST or type annotations.
- **Aliases:**
  - `$routes` → `src/routes`, `$tests` → `src/tests` (see [svelte.config.js](svelte.config.js)).

## External Dependencies
- `zimmerframe` for AST walking
- Svelte's compiler for parsing
- Gro for build/test/check workflows

## Conventions & Tips
- Use Gro scripts for all dev tasks; avoid direct use of Vite/SvelteKit scripts.
- Metadata extraction logic is centralized in [docinfo.ts](src/lib/docinfo.ts); extend here for new features.
- For new Svelte component samples, add to [tests/samples/](tests/samples/) with corresponding `ast.json` and `expected.json`.
- This repo is experimental; expect incomplete features and evolving patterns.

---

_If any section is unclear or missing important project-specific details, please provide feedback to improve these instructions._
