import { Injectable, OnDestroy, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { distinctUntilChanged, first, takeUntil } from 'rxjs/operators';
import { MockEnclosureConfig } from 'app/core/testing/mock-enclosure/interfaces/mock-enclosure.interface';
import { MockEnclosureGenerator } from 'app/core/testing/mock-enclosure/mock-enclosure-generator.utils';
import { MockConfig } from 'app/modules/websocket-debug-panel/interfaces/mock-config.interface';
import {
  addMockConfig,
  deleteMockConfig,
  updateMockConfig,
} from 'app/modules/websocket-debug-panel/store/websocket-debug.actions';
import { selectEnclosureMockConfig, selectMockConfigs } from 'app/modules/websocket-debug-panel/store/websocket-debug.selectors';
import { enclosureMockIds } from 'app/modules/websocket-debug-panel/utils/mock-id.utils';

@Injectable({
  providedIn: 'root',
})
export class EnclosureMockService implements OnDestroy {
  private store$ = inject(Store);
  private mockGenerator: MockEnclosureGenerator | null = null;
  private currentConfig: MockEnclosureConfig | null = null;
  private readonly destroy$ = new Subject<void>();

  constructor() {
    // Initialize the subscription immediately
    this.initializeSubscription();
  }

  private initializeSubscription(): void {
    // Use distinctUntilChanged to avoid processing the same config multiple times
    const enclosureMockConfig$ = this.store$.select(selectEnclosureMockConfig);
    enclosureMockConfig$
      .pipe(
        // Skip processing if config hasn't actually changed
        distinctUntilChanged((prev, curr) => prev.enabled === curr.enabled
          && prev.controllerModel === curr.controllerModel
          && JSON.stringify(prev.expansionModels) === JSON.stringify(curr.expansionModels)
          && prev.scenario === curr.scenario),
        takeUntil(this.destroy$),
      )
      .subscribe((config) => {
        const wasEnabled = this.currentConfig?.enabled;
        const isEnabled = config.enabled && config.controllerModel !== null;

        this.currentConfig = config;

        if (isEnabled) {
          this.mockGenerator = new MockEnclosureGenerator(config);
          this.updateMockConfigs();
        } else {
          this.mockGenerator = null;
          if (wasEnabled) {
            this.removeMockConfigs();
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.removeMockConfigs();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateMockConfigs(): void {
    if (!this.mockGenerator) {
      return;
    }

    // Create/update mock configs for each enclosure endpoint
    const mockConfigs: MockConfig[] = [
      {
        id: enclosureMockIds.dashboard,
        enabled: true,
        methodName: 'webui.enclosure.dashboard',
        response: {
          result: this.mockGenerator.webuiDashboardEnclosureResponse(),
        },
      },
      {
        id: enclosureMockIds.isIxHardware,
        enabled: true,
        methodName: 'truenas.is_ix_hardware',
        response: {
          result: true,
        },
      },
    ];

    // Get existing mock configs to check if we need to add or update
    this.store$.select(selectMockConfigs)
      .pipe(first())
      .subscribe((existingConfigs) => {
        mockConfigs.forEach((config) => {
          const exists = existingConfigs.some((existing) => existing.id === config.id);
          if (exists) {
            this.store$.dispatch(updateMockConfig({ config }));
          } else {
            this.store$.dispatch(addMockConfig({ config }));
          }
        });
      });
  }

  private removeMockConfigs(): void {
    // Remove all enclosure mock configs
    Object.values(enclosureMockIds).forEach((id) => {
      this.store$.dispatch(deleteMockConfig({ id }));
    });
  }
}
