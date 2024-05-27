import 'jest-canvas-mock';
import { InferInputSignals, Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import * as PIXI from 'pixi.js';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { EnclosureDisksComponent } from 'app/pages/system/old-view-enclosure/components/enclosure-disks/enclosure-disks.component';
import { SystemProfile } from 'app/pages/system/old-view-enclosure/components/view-enclosure/view-enclosure.component';
import { ViewConfig } from 'app/pages/system/old-view-enclosure/interfaces/view.config';
import { EnclosureState, EnclosureStore } from 'app/pages/system/old-view-enclosure/stores/enclosure-store.service';
import { DiskTemperatureService } from 'app/services/disk-temperature.service';
import { PreferencesState } from 'app/store/preferences/preferences.reducer';
import { selectPreferencesState } from 'app/store/preferences/preferences.selectors';

Object.defineProperty(PIXI, '', {});

describe('EnclosureDisksComponent', () => {
  let spectator: Spectator<EnclosureDisksComponent>;

  const createComponent = createComponentFactory({
    component: EnclosureDisksComponent,
    providers: [
      mockWebSocket([
        mockCall('webui.enclosure.dashboard'),
      ]),
      mockProvider(EnclosureStore),
      mockProvider(DiskTemperatureService, {
        temperature$: of({}),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectPreferencesState,
            value: {
              areLoaded: true,
              preferences: {},
            } as PreferencesState,
          },
        ],
      }),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        profile: {
          enclosureStore$: of({
            selectedEnclosure: 'enclosure2',
            enclosures: [
              { id: 'enclosure1', label: 'Test enclosure 1', elements: {} },
              { id: 'enclosure2', label: 'Test enclosure 2', elements: {} },
            ],
          } as EnclosureState),
        } as SystemProfile,
        'current-tab': {
          alias: 'Disks',
        } as ViewConfig,
      } as InferInputSignals<EnclosureDisksComponent>,
    });
  });

  it('shows title', () => {
    expect(spectator.query('.mat-card-title-text').textContent.trim()).toBe('Disks on Test enclosure 2 (1)');
  });
});
