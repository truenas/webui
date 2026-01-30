import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { tnIconMarker } from '@truenas/ui-components';
import {
  filter, tap, switchMap, withLatestFrom,
} from 'rxjs/operators';
import { MockEnclosureScenario } from 'app/core/testing/mock-enclosure/enums/mock-enclosure.enum';
import { EnclosureModel } from 'app/enums/enclosure-model.enum';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ignoreTranslation } from 'app/modules/translate/translate.helper';
import { DuplicateCallTrackerService } from 'app/modules/websocket/duplicate-call-tracker.service';
import { exportFilePrefix, storageKeys } from 'app/modules/websocket-debug-panel/constants';
import {
  MockConfig, MockResponse,
} from 'app/modules/websocket-debug-panel/interfaces/mock-config.interface';
import { safeGetItem, safeSetItem } from 'app/modules/websocket-debug-panel/utils/local-storage-utils';
import * as WebSocketDebugActions from './websocket-debug.actions';
import {
  selectMockConfigs, selectIsPanelOpen, selectEnclosureMockConfig, selectDuplicateNotificationsEnabled,
} from './websocket-debug.selectors';

@Injectable()
export class WebSocketDebugEffects {
  private actions$ = inject(Actions);
  private store$ = inject(Store);
  private duplicateTracker = inject(DuplicateCallTrackerService);
  private snackbar = inject(SnackbarService);

  loadMockConfigs$ = createEffect(() => this.actions$.pipe(
    ofType(WebSocketDebugActions.loadMockConfigs),
    switchMap(() => {
      const rawConfigs = safeGetItem<MockConfig[]>(storageKeys.MOCK_CONFIGS, []);
      // Handle backward compatibility: convert old configs without 'type' field
      const configs = rawConfigs.map((config) => {
        if (!config.response || !('type' in config.response)) {
          // Old format: convert to new format with 'success' type
          const oldResponse = config.response as unknown as Record<string, unknown> | undefined;
          const newResponse: MockResponse = {
            type: 'success',
            result: oldResponse?.result ?? null,
            delay: oldResponse?.delay as number | undefined,
          };
          return {
            ...config,
            response: newResponse,
          };
        }
        return config;
      });
      return [WebSocketDebugActions.mockConfigsLoaded({ configs })];
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
      safeSetItem(storageKeys.MOCK_CONFIGS, configs);
    }),
  ), { dispatch: false });

  persistPanelState$ = createEffect(() => this.actions$.pipe(
    ofType(WebSocketDebugActions.setPanelOpen, WebSocketDebugActions.togglePanel),
    withLatestFrom(this.store$.select(selectIsPanelOpen)),
    tap(([, isPanelOpen]) => {
      safeSetItem(storageKeys.PANEL_OPEN, isPanelOpen);
    }),
  ), { dispatch: false });

  exportMockConfigs$ = createEffect(() => this.actions$.pipe(
    ofType(WebSocketDebugActions.exportMockConfigs),
    withLatestFrom(this.store$.select(selectMockConfigs)),
    tap(([, configs]) => {
      const dataStr = JSON.stringify(configs, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

      const exportFileDefaultName = `${exportFilePrefix}-${new Date().toISOString().split('T')[0]}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }),
  ), { dispatch: false });

  loadEnclosureMockConfig$ = createEffect(() => this.actions$.pipe(
    ofType(WebSocketDebugActions.loadEnclosureMockConfig),
    switchMap(() => {
      const config = safeGetItem<{
        enabled: boolean;
        controllerModel: EnclosureModel | null;
        expansionModels: EnclosureModel[];
        scenario: MockEnclosureScenario;
      } | null>(storageKeys.ENCLOSURE_MOCK_CONFIG, null);
      return [WebSocketDebugActions.enclosureMockConfigLoaded({ config })];
    }),
  ));

  saveEnclosureMockConfig$ = createEffect(() => this.actions$.pipe(
    ofType(WebSocketDebugActions.setEnclosureMockConfig),
    withLatestFrom(this.store$.select(selectEnclosureMockConfig)),
    tap(([, config]) => {
      safeSetItem(storageKeys.ENCLOSURE_MOCK_CONFIG, config);
    }),
  ), { dispatch: false });

  showDuplicateNotification$ = createEffect(() => this.duplicateTracker.duplicateCall$.pipe(
    withLatestFrom(
      this.store$.select(selectDuplicateNotificationsEnabled),
      this.store$.select(selectIsPanelOpen),
    ),
    filter(([, enabled]) => enabled),
    tap(([method, , isPanelOpen]) => {
      this.snackbar.open({
        message: ignoreTranslation(`Duplicate API call: "${method}"`),
        icon: tnIconMarker('alert', 'mdi'),
        iconCssColor: 'var(--orange)',
        duration: 5000,
        button: isPanelOpen
          ? undefined
          : {
              title: ignoreTranslation('View'),
              action: () => this.store$.dispatch(WebSocketDebugActions.setPanelOpen({ isOpen: true })),
            },
      });
    }),
  ), { dispatch: false });

  persistDuplicateNotificationsSetting$ = createEffect(() => this.actions$.pipe(
    ofType(
      WebSocketDebugActions.toggleDuplicateNotifications,
      WebSocketDebugActions.setDuplicateNotificationsEnabled,
    ),
    withLatestFrom(this.store$.select(selectDuplicateNotificationsEnabled)),
    tap(([, enabled]) => {
      safeSetItem(storageKeys.DUPLICATE_NOTIFICATIONS_ENABLED, enabled);
    }),
  ), { dispatch: false });

  loadDuplicateNotificationsSetting$ = createEffect(() => this.actions$.pipe(
    ofType(WebSocketDebugActions.loadMockConfigs),
    switchMap(() => {
      const enabled = safeGetItem<boolean>(storageKeys.DUPLICATE_NOTIFICATIONS_ENABLED, false);
      return [WebSocketDebugActions.setDuplicateNotificationsEnabled({ enabled })];
    }),
  ));
}
