import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import {
  tap, switchMap, withLatestFrom,
} from 'rxjs/operators';
import { LocalStorageError } from 'app/modules/websocket-debug-panel/interfaces/error.types';
import { MockConfig } from 'app/modules/websocket-debug-panel/interfaces/mock-config.interface';
import * as WebSocketDebugActions from './websocket-debug.actions';
import { selectMockConfigs, selectIsPanelOpen } from './websocket-debug.selectors';

const mockConfigsStorageKey = 'websocket-debug-mock-configs';

@Injectable()
export class WebSocketDebugEffects {
  loadMockConfigs$ = createEffect(() => this.actions$.pipe(
    ofType(WebSocketDebugActions.loadMockConfigs),
    switchMap(() => {
      // Async localStorage read
      return Promise.resolve().then(() => {
        try {
          const stored = localStorage.getItem(mockConfigsStorageKey);
          if (!stored) {
            return WebSocketDebugActions.mockConfigsLoaded({ configs: [] });
          }
          try {
            const configs: MockConfig[] = JSON.parse(stored) as MockConfig[];
            return WebSocketDebugActions.mockConfigsLoaded({ configs });
          } catch (parseError) {
            const error = new LocalStorageError(
              'Failed to parse mock configs from localStorage',
              'parse',
              mockConfigsStorageKey,
              parseError,
            );
            console.error('Failed to load mock configs:', error);
            return WebSocketDebugActions.mockConfigsLoaded({ configs: [] });
          }
        } catch (readError) {
          const error = new LocalStorageError(
            'Failed to read mock configs from localStorage',
            'read',
            mockConfigsStorageKey,
            readError,
          );
          console.error('Failed to load mock configs:', error);
          return WebSocketDebugActions.mockConfigsLoaded({ configs: [] });
        }
      });
    }),
  ));

  saveMockConfigs$ = createEffect(() => this.actions$.pipe(
    ofType(
      WebSocketDebugActions.addMockConfig,
      WebSocketDebugActions.updateMockConfig,
      WebSocketDebugActions.deleteMockConfig,
      WebSocketDebugActions.toggleMockConfig,
      WebSocketDebugActions.saveMockConfigs,
    ),
    withLatestFrom(this.store$.select(selectMockConfigs)),
    tap(([, configs]) => {
      // Async localStorage write
      Promise.resolve().then(() => {
        try {
          const serialized = JSON.stringify(configs);
          localStorage.setItem(mockConfigsStorageKey, serialized);
        } catch (writeError) {
          const error = new LocalStorageError(
            'Failed to save mock configs to localStorage',
            'write',
            mockConfigsStorageKey,
            writeError,
          );
          console.error('Failed to save mock configs:', error);
        }
      });
    }),
  ), { dispatch: false });

  persistPanelState$ = createEffect(() => this.actions$.pipe(
    ofType(WebSocketDebugActions.setPanelOpen, WebSocketDebugActions.togglePanel),
    withLatestFrom(this.store$.select(selectIsPanelOpen)),
    tap(([, isPanelOpen]) => {
      // Async localStorage write
      Promise.resolve().then(() => {
        try {
          localStorage.setItem('websocket-debug-panel-open', JSON.stringify(isPanelOpen));
        } catch (writeError) {
          const error = new LocalStorageError(
            'Failed to persist panel state to localStorage',
            'write',
            'websocket-debug-panel-open',
            writeError,
          );
          console.error('Failed to persist panel state:', error);
        }
      });
    }),
  ), { dispatch: false });

  exportMockConfigs$ = createEffect(() => this.actions$.pipe(
    ofType(WebSocketDebugActions.exportMockConfigs),
    withLatestFrom(this.store$.select(selectMockConfigs)),
    tap(([, configs]) => {
      const dataStr = JSON.stringify(configs, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

      const exportFileDefaultName = `mock-configs-${new Date().toISOString().split('T')[0]}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }),
  ), { dispatch: false });

  constructor(
    private actions$: Actions,
    private store$: Store,
  ) {}
}
