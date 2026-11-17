import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';
import { sortSearchResults } from 'app/modules/global-search/services/utils/sort-search-results';

describe('sortSearchResults', () => {
  const consoleCard = 'System > Advanced Settings > Console';
  const shell = 'System > Shell';
  const elements = [
    ...['Configure Console', 'Console Menu', 'Enable Serial Console', 'Serial Port', 'Serial Speed', 'MOTD Banner']
      .map((name) => ({ hierarchy: ['System', 'Advanced Settings', 'Console', name] }) as UiSearchableElement),
    { hierarchy: ['System', 'Advanced Settings', 'Console'] } as UiSearchableElement,
    {
      hierarchy: ['System', 'Shell'],
      synonyms: ['CLI', 'Terminal', 'Console', 'Command Line Interface', 'Prompt'],
    } as UiSearchableElement,
  ];

  function sortedNames(term: string): string[] {
    return sortSearchResults(term, [...elements]).map((element) => element.hierarchy.join(' > '));
  }

  it('ranks an element whose own synonym is the term above elements that only share an ancestor with it', () => {
    expect(sortedNames('Console').slice(0, 2)).toEqual([consoleCard, shell]);
  });

  it('ranks a synonym that starts with the term above elements whose ancestor starts with it', () => {
    const names = sortedNames('cons');

    expect(names.indexOf(shell)).toBeLessThan(names.indexOf(`${consoleCard} > Serial Port`));
    expect(names.indexOf(shell)).toBeLessThan(6);
  });

  it('ranks an element whose own name starts with the term above one whose synonym does', () => {
    const names = sortedNames('cons');

    expect(names.indexOf(consoleCard)).toBeLessThan(names.indexOf(shell));
    expect(names.indexOf(`${consoleCard} > Console Menu`)).toBeLessThan(names.indexOf(shell));
  });
});
