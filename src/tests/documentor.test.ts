import { Svelte5Documentor } from '../lib/documentor.js';
import {join} from 'path';
import { describe, it, expect } from 'vitest';

const  path = join('src', 'tests', 'samples');


import { readdirSync, readFileSync } from 'fs';
import { resolve, join as joinPath } from 'path';


const samplesDir = resolve(path);
const sampleFolders = readdirSync(samplesDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

describe('Svelte5Documentor - samples', () => {
  for (const folder of sampleFolders) {
    it(`should extract docinfo for sample: ${folder}`, async () => {
      const samplePath = joinPath(samplesDir, folder, 'test.svelte');
      const expectedPath = joinPath(samplesDir, folder, 'expected.json');
      const expected = JSON.parse(readFileSync(expectedPath, 'utf8'));

      const doc = new Svelte5Documentor();
      const result = await doc.parseFile(samplePath);
      expect(result.error).toBeUndefined();

      if (expected.generics === null && result.docinfo.generics === undefined) {
        result.docinfo.generics = null;
      }
      expect(result.docinfo).toEqual(expected);
    });
  }
});
