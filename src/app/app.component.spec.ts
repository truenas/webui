import { Title } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { BehaviorSubject, Subject } from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { LayoutService } from 'app/modules/layout/layout.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { PingService } from 'app/modules/websocket/ping.service';
import { selectIsPanelOpen } from 'app/modules/websocket-debug-panel/store/websocket-debug.selectors';
import { DetectBrowserService } from 'app/services/detect-browser.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let spectator: Spectator<AppComponent>;
  let isAuthenticated$: BehaviorSubject<boolean>;
  let routerEvents$: Subject<NavigationEnd>;

  const createComponent = createComponentFactory({
    component: AppComponent,
    shallow: true,
    providers: [
      mockProvider(Title),
      mockProvider(DetectBrowserService, {
        matchesBrowser: jest.fn(() => false),
      }),
      mockProvider(LayoutService),
      mockProvider(DialogService, {
        closeAllDialogs: jest.fn(),
      }),
      mockProvider(SnackbarService),
      mockProvider(SlideIn, {
        closeAll: jest.fn(),
      }),
      mockProvider(PingService, {
        initializePingService: jest.fn(),
      }),
      provideMockStore({
        selectors: [
          { selector: selectIsPanelOpen, value: false },
        ],
      }),
      {
        provide: WINDOW,
        useValue: {
          location: { hostname: 'localhost' },
          matchMedia: jest.fn(() => ({
            matches: false,
            addEventListener: jest.fn(),
          })),
          sessionStorage: {
            setItem: jest.fn(),
          },
        } as unknown as Window,
      },
    ],
  });

  beforeEach(() => {
    isAuthenticated$ = new BehaviorSubject<boolean>(false);
    routerEvents$ = new Subject<NavigationEnd>();

    spectator = createComponent({
      providers: [
        mockProvider(WebSocketStatusService, {
          isAuthenticated$: isAuthenticated$.asObservable(),
        }),
        mockProvider(Router, {
          events: routerEvents$.asObservable(),
          navigate: jest.fn(),
          currentNavigation: jest.fn(() => null),
        }),
      ],
    });
  });

  it('redirects to signin and closes dialogs when authentication is lost', () => {
    isAuthenticated$.next(true);
    isAuthenticated$.next(false);

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/signin']);
    expect(spectator.inject(DialogService).closeAllDialogs).toHaveBeenCalled();
  });

  it('does not redirect when not previously authenticated', () => {
    isAuthenticated$.next(false);

    expect(spectator.inject(Router).navigate).not.toHaveBeenCalled();
    expect(spectator.inject(DialogService).closeAllDialogs).not.toHaveBeenCalled();
  });
});
