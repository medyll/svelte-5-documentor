import { Svelte5Documentor } from '../src/lib/documentor.js';
import {join} from 'path';
import assert from 'assert';
import { describe, it } from 'vitest';
const mreowsPath = join('src', 'routes', 'Mreows.svelte');

describe('Svelte5Documentor - Mreows.svelte', () => {
  const doc = new Svelte5Documentor({paths: mreowsPath});

  it('parseFile extrait les props attendues', async () => {
    const result = await doc.parseFile(mreowsPath);
    const props = result.docinfo.props;
    assert(Array.isArray(props), 'props doit être un tableau');
    const names = props.map(p => p.name);
    assert(names.includes('mreows'), 'doit contenir la prop mreows');
    const mreowsProp = props.find(p => p.name === 'mreows');
    assert(mreowsProp.optional, 'mreows doit être optionnel');
    assert(mreowsProp.type.includes('Mreow[]'), 'type doit inclure Mreow[]');
  });

  it('parseFile extrait les exports attendus', async () => {
    const result = await doc.parseFile(mreowsPath);
    const exports = result.docinfo.exports;
    assert(Array.isArray(exports), 'exports doit être un tableau');
    const names = exports.map(e => e.name);
    assert(names.includes('items'), 'doit contenir l\'export items');
    const itemsExport = exports.find(e => e.name === 'items');
    assert(itemsExport.type && itemsExport.type.includes('Mreow[]'), 'type doit inclure Mreow[]');
  });

  it('parseDirectory fonctionne sur le dossier parent', async () => {
    const results = await doc.parseDirectory(join('src', 'routes'));
    const found = results.find(r => r.file.endsWith('Mreows.svelte'));
    assert(found, 'Mreows.svelte doit être trouvé dans le dossier');
  });
});
