import { fakeAsync, flush, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import { Role } from 'app/enums/role.enum';
import { UiSearchableElement } from 'app/interfaces/ui-searchable-element.interface';
import { UiSearchResultsComponent } from './ui-search-results.component';

describe('UiSearchResultsComponent', () => {
  let spectator: Spectator<UiSearchResultsComponent>;
  let router: Router;

  const createComponent = createComponentFactory({
    component: UiSearchResultsComponent,
    imports: [
      RouterTestingModule.withRoutes([]),
    ],
    mocks: [TranslateService],
  });

  beforeEach(() => {
    spectator = createComponent();
    router = spectator.inject(Router);
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
