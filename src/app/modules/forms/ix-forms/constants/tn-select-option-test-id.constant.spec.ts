import { existsSync, readdirSync, readFileSync } from 'fs';
import { dirname, join, relative } from 'path';
import { TnSelectOption } from '@truenas/ui-components';
import { optionTestIdByLabel } from 'app/modules/forms/ix-forms/constants/tn-select-option-test-id.constant';

/** Opening tag of a `tn-select` / `tn-autocomplete`, skipping over quoted attribute values. */
const selectOpeningTagRegex = /<tn-(?:select|autocomplete)(?=[\s>])(?:"[^"]*"|'[^']*'|[^>"'])*>/g;

/** The same tag, matched by its opening delimiter alone — the floor the full regex has to reach. */
const selectTagStartRegex = /<tn-(?:select|autocomplete)(?=[\s>])/g;

/** Body of an inline `template:` in a `@Component({ ... })`, so those markup blocks are scanned too. */
const inlineTemplateRegex = /template:\s*`([^`]*)`/g;

function findRepoRoot(): string {
  let current = __dirname;
  while (!existsSync(join(current, 'package.json'))) {
    const parent = dirname(current);
    if (parent === current) {
      throw new Error(`Cannot locate the repo root: no package.json above ${__dirname}`);
    }
    current = parent;
  }
  return current;
}

/**
 * Every `.html` template, plus the `.ts` files that may carry an inline one. Specs are left out:
 * their inline fixtures are throwaway markup that nothing selects on.
 */
function findTemplateFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      return findTemplateFiles(entryPath);
    }
    if (entry.name.endsWith('.html')) {
      return [entryPath];
    }
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts') ? [entryPath] : [];
  });
}

/** The markup of a file: an `.html` template whole, or only the inline `template:` bodies of a `.ts`. */
function readMarkup(file: string): string {
  const contents = readFileSync(file, 'utf8');
  if (file.endsWith('.html')) {
    return contents;
  }
  return [...contents.matchAll(inlineTemplateRegex)].map(([, template]) => template).join('\n');
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
  const markup = findTemplateFiles(join(repoRoot, 'src'))
    .map((file) => ({ template: relative(repoRoot, file), contents: readMarkup(file) }));

  const elements = markup.flatMap(({ template, contents }) => {
    return (contents.match(selectOpeningTagRegex) || []).map((openingTag) => ({ template, openingTag }));
  });

  it('parses every select it finds (i.e. the scan itself still works)', () => {
    const tagStarts = markup.reduce(
      (count, { contents }) => count + (contents.match(selectTagStartRegex) || []).length,
      0,
    );

    // Reported against the tags themselves, so a tag the opening-tag regex cannot consume fails
    // here by count rather than quietly shrinking the population the next test checks.
    expect(elements).toHaveLength(tagStarts);
    expect(tagStarts).toBeGreaterThan(200);
  });

  it('has no select without a key', () => {
    const missing = elements
      .filter(({ openingTag }) => !openingTag.includes('[optionTestIdKey]'))
      .map(({ template, openingTag }) => `${template}: ${openingTag.replace(/\s+/g, ' ')}`);

    expect(missing).toEqual([]);
  });
});
