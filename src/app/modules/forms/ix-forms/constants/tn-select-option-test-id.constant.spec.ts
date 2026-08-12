import { existsSync, readdirSync, readFileSync } from 'fs';
import { dirname, join, relative } from 'path';
import { TnSelectOption } from '@truenas/ui-components';
import { optionTestIdByLabel } from 'app/modules/forms/ix-forms/constants/tn-select-option-test-id.constant';

/** Opening tag of a `tn-select` / `tn-autocomplete`, skipping over quoted attribute values. */
const selectOpeningTagRegex = /<tn-(?:select|autocomplete)(?=[\s>])(?:"[^"]*"|'[^']*'|[^>"'])*>/g;

function findRepoRoot(): string {
  let current = __dirname;
  while (!existsSync(join(current, 'package.json'))) {
    current = dirname(current);
  }
  return current;
}

function findTemplates(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      return findTemplates(entryPath);
    }
    return entry.name.endsWith('.html') ? [entryPath] : [];
  });
}

describe('optionTestIdByLabel', () => {
  it('derives the id from the label instead of the value', () => {
    expect(optionTestIdByLabel({ label: 'My Pool', value: 12 } as TnSelectOption)).toBe('my-pool');
  });

  it('normalizes the label the way the legacy [ixTest] directive did', () => {
    expect(optionTestIdByLabel({ label: 'SSH01', value: 'ssh01' } as TnSelectOption)).toBe('ssh-01');
    expect(optionTestIdByLabel({
      label: 'SSH private key stored in user\'s home directory',
      value: 'KEY',
    } as TnSelectOption)).toBe('ssh-private-key-stored-in-users-home-directory');
  });
});

/**
 * Guards the invariant the docblock in `tn-select-option-test-id.constant.ts` explains: without a
 * pinned key the library derives an option's id from its *value*, so a select added without one
 * silently emits value-derived ids (`option-sshconnectmode-0`) with no build error and no failing
 * component spec. Fails loudly on the one that forgets.
 */
describe('every tn-select / tn-autocomplete pins optionTestIdKey', () => {
  const repoRoot = findRepoRoot();
  const templates = findTemplates(join(repoRoot, 'src'));

  const elements = templates.flatMap((template) => {
    return (readFileSync(template, 'utf8').match(selectOpeningTagRegex) || [])
      .map((openingTag) => ({ template: relative(repoRoot, template), openingTag }));
  });

  it('finds selects to check (i.e. the scan itself still works)', () => {
    expect(elements.length).toBeGreaterThan(200);
  });

  it('has no select without a key', () => {
    const missing = elements
      .filter(({ openingTag }) => !openingTag.includes('[optionTestIdKey]'))
      .map(({ template, openingTag }) => `${template}: ${openingTag.replace(/\s+/g, ' ')}`);

    expect(missing).toEqual([]);
  });
});
