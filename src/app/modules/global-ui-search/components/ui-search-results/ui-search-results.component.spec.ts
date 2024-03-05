// ui-search-results.component.spec.ts
import { fakeAsync, flush, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Role } from 'app/enums/role.enum';
import { UiSearchableElement } from 'app/interfaces/ui-searchable-element.interface';
import { UiSearchResultsComponent } from './ui-search-results.component';

describe('UiSearchResultsComponent', () => {
  let spectator: Spectator<UiSearchResultsComponent>;
  let translateService: TranslateService;
  let router: Router;

  const createComponent = createComponentFactory({
    component: UiSearchResultsComponent,
    imports: [
      TranslateModule.forRoot(),
      RouterTestingModule.withRoutes([]),
    ],
    mocks: [TranslateService],
  });

  beforeEach(() => {
    spectator = createComponent();
    translateService = spectator.inject(TranslateService);
    router = spectator.inject(Router);
  });

  it('should map results with translations', () => {
    const mockResults: UiSearchableElement[] = [{
      hierarchy: ['Storage'],
      synonyms: ['Disk'],
      requiredRoles: ['FULL_ADMIN' as Role],
      routerLink: null,
      anchorRouterLink: ['/storage'],
      anchor: 'storage-anchor',
      triggerAnchor: null,
    }];

    jest.spyOn(translateService, 'instant').mockImplementation((key) => `Translated ${key}`);

    spectator.setInput('results', mockResults);
    spectator.detectChanges();

    expect(spectator.component.mappedResults[0].hierarchy[0]).toBe('Translated Storage');
    expect(spectator.component.mappedResults[0].synonyms[0]).toBe('Translated Disk');
  });

  it('should emit selected event and navigate on result click', fakeAsync(() => {
    const mockResults: UiSearchableElement[] = [{
      hierarchy: ['Storage'],
      synonyms: [],
      requiredRoles: ['FULL_ADMIN' as Role],
      routerLink: [],
      anchorRouterLink: ['/storage', 'create'],
      anchor: 'create-pool-button',
      triggerAnchor: null,
    }];

    spectator.setInput('searchTerm', 'Storage');
    spectator.setInput('results', mockResults);
    spectator.detectChanges();

    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    const emitSpy = jest.spyOn(spectator.component.selected, 'emit');

    spectator.click('.search-result');
    tick();

    expect(navigateSpy).toHaveBeenCalledWith(mockResults[0].anchorRouterLink);
    expect(emitSpy).toHaveBeenCalled();

    flush();
  }));
});
