import { BreakpointObserver } from '@angular/cdk/layout';
import { Router } from '@angular/router';
import {
  createServiceFactory,
  mockProvider,
  SpectatorService,
} from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { BehaviorSubject, of } from 'rxjs';
import { SidenavService } from 'app/modules/layout/sidenav.service';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

describe('SidenavService', () => {
  let spectator: SpectatorService<SidenavService>;
  const breakpointObserve$ = new BehaviorSubject({ matches: true });
  const createService = createServiceFactory({
    service: SidenavService,
    providers: [
      mockProvider(Router, {
        events: of(),
      }),
      mockProvider(BreakpointObserver, {
        observe: jest.fn(() => breakpointObserve$),
      }),
      provideMockActions(of()),
      provideMockStore({
        selectors: [
          {
            selector: selectPreferences,
            value: {
              sidenavStatus: {
                isCollapsed: true,
              },
            },
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  describe('listenForScreenSizeChanges', () => {
    it('listens for screen size changes and sets isMobile accordingly', () => {
      expect(spectator.service.isMobile()).toBe(true);

      breakpointObserve$.next({ matches: false });
      expect(spectator.service.isMobile()).toBe(false);
    });
  });
});
