import { Router, provideRouter } from '@angular/router';
import { mockProvider, createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { WINDOW } from 'app/helpers/window.helper';
import { GlobalSearchSection } from 'app/modules/global-search/enums/global-search-section.enum';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';
import { UiSearchDirectivesService } from 'app/modules/global-search/services/ui-search-directives.service';
import { UiSearchProvider } from 'app/modules/global-search/services/ui-search.service';
import { GlobalSearchResultsComponent } from './global-search-results.component';

const mockedHelpElement = {
  hierarchy: ['Help Section Item'],
  section: GlobalSearchSection.Help,
  targetHref: 'https://www.truenas.com/docs/scale/27/search/?query=test',
};

const mockedUiElement = {
  hierarchy: ['UI Section Item'],
  section: GlobalSearchSection.Ui,
  anchorRouterLink: ['/ui-section', 'item'],
};

const mockedRecentSearchesElement = {
  hierarchy: ['UI Section Item'],
  section: GlobalSearchSection.RecentSearches,
  anchorRouterLink: ['/ui-section', 'item'],
};

describe('GlobalSearchResultsComponent', () => {
  let spectator: Spectator<GlobalSearchResultsComponent>;
  let router: Router;

  const createComponent = createComponentFactory({
    component: GlobalSearchResultsComponent,
    imports: [
      TranslateModule.forRoot(),
    ],
    providers: [
      provideRouter([]),
      mockAuth(),
      mockProvider(UiSearchDirectivesService, {
        directiveAdded$: of(),
      }),
      mockProvider(UiSearchProvider, {
        selectionChanged$: of(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    router = spectator.inject(Router);
  });

  it('should emit selected event and navigate on result click', () => {
    const mockResults: UiSearchableElement[] = [mockedUiElement];

    spectator.setInput('results', mockResults);
    spectator.detectChanges();

    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    const searchProvider = spectator.inject(UiSearchProvider);
    jest.spyOn(searchProvider, 'select').mockImplementation();

    spectator.click('.search-result');

    expect(navigateSpy).toHaveBeenCalledWith(mockResults[0].anchorRouterLink);
    expect(searchProvider.select).toHaveBeenCalledWith(mockResults[0]);
  });

  function stubRouterUrl(url: string): void {
    Object.defineProperty(router, 'url', { value: url, configurable: true });
  }

  it('should NOT navigate when already on the target path', () => {
    const mockResults: UiSearchableElement[] = [mockedUiElement];

    spectator.setInput('results', mockResults);
    spectator.detectChanges();

    // Pretend the router is already on the entry's target path.
    stubRouterUrl('/ui-section/item');

    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    spectator.click('.search-result');

    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('should navigate to a sibling page when the prefix overlaps but the path is different', () => {
    const sibling: UiSearchableElement = {
      hierarchy: ['Sibling Page'],
      section: GlobalSearchSection.Ui,
      anchorRouterLink: ['/credentials', 'users', 'api-keys'],
    };

    spectator.setInput('results', [sibling]);
    spectator.detectChanges();

    // Currently on /credentials/users — without the wildcard guard, the
    // startsWith fallback could mis-classify the sibling as a descendant.
    stubRouterUrl('/credentials/users');

    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    spectator.click('.search-result');

    expect(navigateSpy).toHaveBeenCalledWith(['/credentials', 'users', 'api-keys']);
  });

  it('should NOT navigate when on a master-detail descendant of a wildcard path', () => {
    const masterDetail: UiSearchableElement = {
      hierarchy: ['Datasets'],
      section: GlobalSearchSection.Ui,
      anchorRouterLink: ['/datasets', '*'],
    };

    spectator.setInput('results', [masterDetail]);
    spectator.detectChanges();

    stubRouterUrl('/datasets/tank/child');

    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    spectator.click('.search-result');

    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('should strip a trailing wildcard from the navigation array before calling router.navigate', () => {
    const masterDetail: UiSearchableElement = {
      hierarchy: ['Datasets'],
      section: GlobalSearchSection.Ui,
      anchorRouterLink: ['/datasets', '*'],
    };

    spectator.setInput('results', [masterDetail]);
    spectator.detectChanges();

    stubRouterUrl('/dashboard');

    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    spectator.click('.search-result');

    expect(navigateSpy).toHaveBeenCalledWith(['/datasets']);
  });

  it('should open link in new window on element clicked if "targetHref" specified', () => {
    const mockResults: UiSearchableElement[] = [mockedHelpElement];

    spectator.setInput('searchTerm', 'Item');
    spectator.setInput('results', mockResults);
    spectator.detectChanges();

    const window = spectator.inject<Window>(WINDOW);
    jest.spyOn(window, 'open').mockImplementation();

    spectator.click('.search-result');

    expect(window.open).toHaveBeenCalledWith(mockResults[0].targetHref, '_blank');

    window.open.mockRestore();
  });

  it('should display 2 sections when input results belong to different sections', () => {
    const mockResults: UiSearchableElement[] = [mockedUiElement, mockedHelpElement];

    spectator.setInput('results', mockResults);
    spectator.setInput('searchTerm', 'Item');
    spectator.detectChanges();

    const sectionHeaders = spectator.queryAll('.section');
    expect(sectionHeaders).toHaveLength(2);

    expect(sectionHeaders[0].textContent).toBe(' UI ');
    expect(sectionHeaders[1].textContent).toBe(' Help ');
  });

  it('should display UI section as empty and show Help Section with an option', () => {
    const mockResults: UiSearchableElement[] = [mockedHelpElement];

    spectator.setInput('results', mockResults);
    spectator.setInput('searchTerm', 'Item');
    spectator.detectChanges();

    const sectionHeaders = spectator.queryAll('.section');
    expect(sectionHeaders).toHaveLength(2);

    expect(sectionHeaders[0].textContent).toBe(' UI ');
    expect(sectionHeaders[1].textContent).toBe(' Help ');

    const emptyContent = spectator.query('h4.no-results')!;
    expect(emptyContent.textContent).toBe('No results found in {section}');

    const sectionContent = spectator.queryAll('.section-content');
    expect(sectionContent).toHaveLength(1);

    expect(sectionContent[0].textContent).toBe('Help Section Item');
  });

  it('should toggle between showing limited results and all results', () => {
    const mockResults: UiSearchableElement[]
      = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map((adjustment) => ({
        ...mockedUiElement,
        anchor: adjustment,
        hierarchy: [...mockedUiElement.hierarchy, adjustment],
      }))
    ;

    spectator.setInput('results', mockResults);
    spectator.setInput('searchTerm', 'Item');
    spectator.detectChanges();

    let shownResults = spectator.queryAll('.search-result');
    expect(shownResults).toHaveLength(spectator.component.initialResultsLimit);

    const showAllButton = spectator.query('.toggle-show-more')!;
    spectator.click(showAllButton);
    spectator.detectChanges();

    shownResults = spectator.queryAll('.search-result');
    expect(shownResults).toHaveLength(10);

    spectator.click(showAllButton);
    spectator.detectChanges();

    shownResults = spectator.queryAll('.search-result');
    expect(shownResults).toHaveLength(spectator.component.initialResultsLimit);
  });

  it('should display Recent Searches sections', () => {
    const mockResults: UiSearchableElement[] = [mockedRecentSearchesElement];

    spectator.setInput('results', mockResults);
    spectator.setInput('searchTerm', '');
    spectator.detectChanges();

    const sectionHeaders = spectator.queryAll('.section');
    expect(sectionHeaders).toHaveLength(1);
    expect(sectionHeaders[0].textContent).toBe(' Recent Searches ');
  });

  it('should remove element from recent searches and update local storage', () => {
    const mockResults: UiSearchableElement[] = [mockedRecentSearchesElement];
    const window = spectator.inject<Window>(WINDOW);
    (window.localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockResults));

    spectator.setInput('results', mockResults);
    spectator.detectChanges();

    const removeIcon = spectator.query('.icon')!;
    const recentSearchRemovedSpy = jest.spyOn(spectator.component.recentSearchRemoved, 'emit');

    spectator.click(removeIcon);

    expect(window.localStorage.setItem).toHaveBeenCalledWith('recentSearches', JSON.stringify([]));
    expect(recentSearchRemovedSpy).toHaveBeenCalled();
  });
});
