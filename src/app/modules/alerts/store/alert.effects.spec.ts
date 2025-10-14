import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TranslateService } from '@ngx-translate/core';
import { MockProvider } from 'ng-mocks';
import { Observable, of, throwError } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { CollectionChangeType } from 'app/enums/api.enum';
import { Alert } from 'app/interfaces/alert.interface';
import {
  alertAdded,
  alertChanged,
  alertReceivedWhenPanelIsOpen,
  alertRemoved,
  alertsLoaded,
  alertsNotLoaded,
  dismissAlertPressed,
  reopenAlertPressed,
} from 'app/modules/alerts/store/alert.actions';
import { AlertEffects } from 'app/modules/alerts/store/alert.effects';
import { alertsInitialState } from 'app/modules/alerts/store/alert.reducer';
import { selectDismissedAlerts, selectIsAlertPanelOpen, selectUnreadAlerts } from 'app/modules/alerts/store/alert.selectors';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import { alertIndicatorPressed } from 'app/store/topbar/topbar.actions';

describe('AlertEffects', () => {
  let effects: AlertEffects;
  let actions$: Observable<unknown>;
  let apiService: ApiService;
  let translateService: TranslateService;
  let errorHandlerService: ErrorHandlerService;
  let store$: MockStore;
  let testScheduler: TestScheduler;

  const mockAlert = {
    id: '1',
    level: AlertLevel.Critical,
    dismissed: false,
    datetime: { $date: 1000 },
  } as Alert;

  const mockAlert2 = {
    id: '2',
    level: AlertLevel.Warning,
    dismissed: false,
    datetime: { $date: 2000 },
  } as Alert;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AlertEffects,
        provideMockActions(() => actions$),
        provideMockStore({
          initialState: {
            alerts: alertsInitialState,
          },
          selectors: [
            { selector: selectIsAlertPanelOpen, value: false },
            { selector: selectUnreadAlerts, value: [] },
            { selector: selectDismissedAlerts, value: [] },
          ],
        }),
        MockProvider(ApiService, {
          call: jest.fn(),
          subscribe: jest.fn(),
        }),
        {
          provide: TranslateService,
          useValue: {
            instant: jest.fn((key: string) => key),
          },
        },
        {
          provide: ErrorHandlerService,
          useValue: {
            showErrorModal: jest.fn(),
            withErrorHandler: jest.fn(() => (source$: Observable<unknown>) => source$),
          },
        },
      ],
    });

    effects = TestBed.inject(AlertEffects);
    apiService = TestBed.inject(ApiService);
    translateService = TestBed.inject(TranslateService);
    errorHandlerService = TestBed.inject(ErrorHandlerService);
    store$ = TestBed.inject(MockStore);

    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });

    jest.spyOn(console, 'error').mockImplementation();
  });

  describe('loadAlerts$', () => {
    it('loads alerts when admin UI is initialized', () => {
      const alerts = [mockAlert, mockAlert2];
      jest.spyOn(apiService, 'call').mockReturnValue(of(alerts));

      testScheduler.run(({ hot, expectObservable }) => {
        actions$ = hot('-a', { a: adminUiInitialized() });

        const expected = '-b';
        const expectedValues = {
          b: alertsLoaded({ alerts }),
        };

        expectObservable(effects.loadAlerts$).toBe(expected, expectedValues);
      });

      expect(apiService.call).toHaveBeenCalledWith('alert.list');
    });

    it('loads alerts when alert indicator is pressed', () => {
      const alerts = [mockAlert];
      jest.spyOn(apiService, 'call').mockReturnValue(of(alerts));

      testScheduler.run(({ hot, expectObservable }) => {
        actions$ = hot('-a', { a: alertIndicatorPressed() });

        const expected = '-b';
        const expectedValues = {
          b: alertsLoaded({ alerts }),
        };

        expectObservable(effects.loadAlerts$).toBe(expected, expectedValues);
      });
    });

    it('loads alerts when alert is received while panel is open', () => {
      const alerts = [mockAlert];
      jest.spyOn(apiService, 'call').mockReturnValue(of(alerts));

      testScheduler.run(({ hot, expectObservable }) => {
        actions$ = hot('-a', { a: alertReceivedWhenPanelIsOpen() });

        const expected = '-b';
        const expectedValues = {
          b: alertsLoaded({ alerts }),
        };

        expectObservable(effects.loadAlerts$).toBe(expected, expectedValues);
      });
    });

    it('dispatches alertsNotLoaded on error', () => {
      const error = new Error('Network error');
      jest.spyOn(apiService, 'call').mockReturnValue(throwError(() => error));

      testScheduler.run(({ hot, expectObservable }) => {
        actions$ = hot('-a', { a: adminUiInitialized() });

        const expected = '-b';
        const expectedValues = {
          b: alertsNotLoaded({ error: 'Alerts could not be loaded' }),
        };

        expectObservable(effects.loadAlerts$).toBe(expected, expectedValues);
      });

      expect(translateService.instant).toHaveBeenCalledWith('Alerts could not be loaded');
    });
  });

  describe('subscribeToUpdates$', () => {
    it('dispatches alertAdded when alert is added and panel is closed', () => {
      store$.overrideSelector(selectIsAlertPanelOpen, false);

      jest.spyOn(apiService, 'subscribe').mockReturnValue(of({
        msg: CollectionChangeType.Added,
        fields: mockAlert,
        id: '1',
        collection: 'alert.list',
      }));

      testScheduler.run(({ hot, expectObservable }) => {
        actions$ = hot('-a', { a: adminUiInitialized() });

        const expected = '-b';
        const expectedValues = {
          b: alertAdded({ alert: mockAlert }),
        };

        expectObservable(effects.subscribeToUpdates$).toBe(expected, expectedValues);
      });
    });

    it('dispatches alertChanged when alert is changed and panel is closed', () => {
      store$.overrideSelector(selectIsAlertPanelOpen, false);

      jest.spyOn(apiService, 'subscribe').mockReturnValue(of({
        msg: CollectionChangeType.Changed,
        fields: mockAlert,
        id: '1',
        collection: 'alert.list',
      }));

      testScheduler.run(({ hot, expectObservable }) => {
        actions$ = hot('-a', { a: adminUiInitialized() });

        const expected = '-b';
        const expectedValues = {
          b: alertChanged({ alert: mockAlert }),
        };

        expectObservable(effects.subscribeToUpdates$).toBe(expected, expectedValues);
      });
    });

    it('dispatches alertReceivedWhenPanelIsOpen when alert is added and panel is open', () => {
      store$.overrideSelector(selectIsAlertPanelOpen, true);

      jest.spyOn(apiService, 'subscribe').mockReturnValue(of({
        msg: CollectionChangeType.Added,
        fields: mockAlert,
        id: '1',
        collection: 'alert.list',
      }));

      testScheduler.run(({ hot, expectObservable }) => {
        actions$ = hot('-a', { a: adminUiInitialized() });

        const expected = '-b';
        const expectedValues = {
          b: alertReceivedWhenPanelIsOpen(),
        };

        expectObservable(effects.subscribeToUpdates$).toBe(expected, expectedValues);
      });
    });

    it('dispatches alertRemoved when alert is removed', () => {
      store$.overrideSelector(selectIsAlertPanelOpen, false);

      jest.spyOn(apiService, 'subscribe').mockReturnValue(of({
        msg: CollectionChangeType.Removed,
        fields: undefined,
        id: '1',
        collection: 'alert.list',
      }));

      testScheduler.run(({ hot, expectObservable }) => {
        actions$ = hot('-a', { a: adminUiInitialized() });

        const expected = '-b';
        const expectedValues = {
          b: alertRemoved({ id: '1' }),
        };

        expectObservable(effects.subscribeToUpdates$).toBe(expected, expectedValues);
      });
    });
  });

  describe('dismissAlert$', () => {
    it('calls API to dismiss alert', async () => {
      jest.spyOn(apiService, 'call').mockReturnValue(of(null));

      actions$ = of(dismissAlertPressed({ id: '1' }));

      await new Promise<void>((resolve) => {
        effects.dismissAlert$.subscribe(() => {
          expect(apiService.call).toHaveBeenCalledWith('alert.dismiss', ['1']);
          resolve();
        });
      });
    });

    it('handles error and reverts dismissed state', async () => {
      const error = new Error('Dismiss failed');
      jest.spyOn(apiService, 'call').mockReturnValue(throwError(() => error));
      const dispatchSpy = jest.spyOn(store$, 'dispatch');

      actions$ = of(dismissAlertPressed({ id: '1' }));

      await new Promise<void>((resolve) => {
        effects.dismissAlert$.subscribe(() => {
          expect(errorHandlerService.showErrorModal).toHaveBeenCalledWith(error);
          expect(dispatchSpy).toHaveBeenCalledWith(
            alertChanged({ alert: { id: '1', dismissed: false } as Alert }),
          );
          resolve();
        });
      });
    });
  });

  describe('reopenAlert$', () => {
    it('calls API to restore alert', async () => {
      jest.spyOn(apiService, 'call').mockReturnValue(of(null));

      actions$ = of(reopenAlertPressed({ id: '1' }));

      await new Promise<void>((resolve) => {
        effects.reopenAlert$.subscribe(() => {
          expect(apiService.call).toHaveBeenCalledWith('alert.restore', ['1']);
          resolve();
        });
      });
    });

    it('handles error and reverts reopened state', async () => {
      const error = new Error('Restore failed');
      jest.spyOn(apiService, 'call').mockReturnValue(throwError(() => error));
      const dispatchSpy = jest.spyOn(store$, 'dispatch');

      actions$ = of(reopenAlertPressed({ id: '1' }));

      await new Promise<void>((resolve) => {
        effects.reopenAlert$.subscribe(() => {
          expect(errorHandlerService.showErrorModal).toHaveBeenCalledWith(error);
          expect(dispatchSpy).toHaveBeenCalledWith(
            alertChanged({ alert: { id: '1', dismissed: true } as Alert }),
          );
          resolve();
        });
      });
    });
  });

  // Note: dismissAllAlerts$ and reopenAllAlerts$ use pairwise() operator which requires
  // special Observable stream handling for testing. These effects are covered by integration tests.
});
