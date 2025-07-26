import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import {
  tap, switchMap, withLatestFrom,
} from 'rxjs/operators';
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
          const configs: MockConfig[] = stored ? JSON.parse(stored) as MockConfig[] : [];
          return WebSocketDebugActions.mockConfigsLoaded({ configs });
        } catch (error) {
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
          localStorage.setItem(mockConfigsStorageKey, JSON.stringify(configs));
        } catch (error) {
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
        } catch (error) {
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
