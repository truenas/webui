import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TranslateModule } from '@ngx-translate/core';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { WINDOW } from 'app/helpers/window.helper';
import { GlobalSearchSection } from 'app/modules/global-search/enums/global-search-section';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';
import { GlobalSearchResultsComponent } from './global-search-results.component';

const mockedHelpElement = {
  hierarchy: ['Help Section Item'],
  section: GlobalSearchSection.Help,
  targetHref: 'https://www.example.com/help',
};

const mockedUiElement = {
  hierarchy: ['UI Section Item'],
  section: GlobalSearchSection.Ui,
  anchorRouterLink: ['/ui-section', 'item'],
};

describe('GlobalSearchResultsComponent', () => {
  let spectator: Spectator<GlobalSearchResultsComponent>;
  let router: Router;

  const createComponent = createComponentFactory({
    component: GlobalSearchResultsComponent,
    imports: [
      RouterTestingModule.withRoutes([]),
      TranslateModule.forRoot(),
    ],
    providers: [
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    router = spectator.inject(Router);
  });

  it('should emit selected event and navigate on result click', (() => {
    const mockResults: UiSearchableElement[] = [mockedUiElement];

    spectator.setInput('results', mockResults);
    spectator.detectChanges();

    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    const emitSpy = jest.spyOn(spectator.component.selected, 'emit');

    spectator.click('.search-result');

    expect(navigateSpy).toHaveBeenCalledWith(mockResults[0].anchorRouterLink);
    expect(emitSpy).toHaveBeenCalled();
  }));

  it('should open link in new window on element clicked if "targetHref" specified', (() => {
    const mockResults: UiSearchableElement[] = [mockedHelpElement];

    spectator.setInput('searchTerm', 'Item');
    spectator.setInput('results', mockResults);
    spectator.detectChanges();

    const window = spectator.inject<Window>(WINDOW);
    jest.spyOn(window, 'open').mockImplementation();

    spectator.click('.search-result');

    expect(window.open).toHaveBeenCalledWith(mockResults[0].targetHref, '_blank');

    window.open.mockRestore();
  }));

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

    const emptyContent = spectator.query('h4.no-results');
    expect(emptyContent.textContent).toBe('No results found in {section}');

    const sectionContent = spectator.queryAll('.section-content');
    expect(sectionContent).toHaveLength(1);

    expect(sectionContent[0].textContent).toBe('Help Section Item');
  });

  it('should toggle between showing limited results and all results', () => {
    const mockResults: UiSearchableElement[] = [
      ...['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map((adjustment) => ({
        ...mockedUiElement,
        hierarchy: [...mockedUiElement.hierarchy, adjustment],
      })),
    ];

    spectator.setInput('results', mockResults);
    spectator.setInput('searchTerm', 'Item');
    spectator.detectChanges();

    let shownResults = spectator.queryAll('.search-result');
    expect(shownResults).toHaveLength(spectator.component.resultLimit);

    const showAllButton = spectator.query('.toggle-show-more');
    spectator.click(showAllButton);
    spectator.detectChanges();

    shownResults = spectator.queryAll('.search-result');
    expect(shownResults).toHaveLength(10);

    spectator.click(showAllButton);
    spectator.detectChanges();

    shownResults = spectator.queryAll('.search-result');
    expect(shownResults).toHaveLength(spectator.component.resultLimit);
  });
});
