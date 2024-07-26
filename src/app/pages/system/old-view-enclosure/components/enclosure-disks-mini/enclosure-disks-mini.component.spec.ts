import 'jest-canvas-mock';
import { InferInputSignals, Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import * as PIXI from 'pixi.js';
import { BehaviorSubject, Subject, of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { EnclosureDiskStatus } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { DriveTray } from 'app/pages/system/old-view-enclosure/classes/drivetray';
import { DiskComponent } from 'app/pages/system/old-view-enclosure/components/disk-component/disk.component';
import { EnclosureDisksMiniComponent } from 'app/pages/system/old-view-enclosure/components/enclosure-disks-mini/enclosure-disks-mini.component';
import { SystemProfile } from 'app/pages/system/old-view-enclosure/components/view-enclosure/view-enclosure.component';
import { EnclosureEvent } from 'app/pages/system/old-view-enclosure/interfaces/enclosure-events.interface';
import { OldEnclosure } from 'app/pages/system/old-view-enclosure/interfaces/old-enclosure.interface';
import { ViewConfig } from 'app/pages/system/old-view-enclosure/interfaces/view.config';
import { EnclosureState, EnclosureStore } from 'app/pages/system/old-view-enclosure/stores/enclosure-store.service';
import { DiskTemperatureService } from 'app/services/disk-temperature.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { PreferencesState } from 'app/store/preferences/preferences.reducer';
import { selectPreferencesState, selectTheme } from 'app/store/preferences/preferences.selectors';

Object.defineProperty(PIXI, '', {});

describe('EnclosureDisksMiniComponent', () => {
  let spectator: Spectator<EnclosureDisksMiniComponent>;

  const enclosures: OldEnclosure[] = [
    {
      number: 0,
      id: 'enclosure0',
      label: 'Test enclosure 0',
      model: 'MINI-3.0-E',
      elements: {},
    },
    {
      number: 1,
      id: 'enclosure1',
      label: 'Test enclosure 1',
      model: 'MINI-3.0-X',
      elements: {
        'Array Device Slot': {
          1: {
            pool_info: {
              pool_name: 'test_pool',
              vdev_disks: [],
              disk_status: EnclosureDiskStatus.Online,
            },
            dev: 'sda',
          } as DashboardEnclosureSlot,
        },
      },
    },
  ] as OldEnclosure[];

  const driveTray = new DriveTray('R50', new PIXI.loaders.Loader());
  driveTray.container = new PIXI.Container();
  driveTray.id = '1';

  const createComponent = createComponentFactory({
    component: EnclosureDisksMiniComponent,
    imports: [
      FileSizePipe,
    ],
    declarations: [
      DiskComponent,
    ],
    providers: [
      mockWebSocket([
        mockCall('webui.enclosure.dashboard'),
        mockCall('enclosure.set_slot_status'),
      ]),
      mockProvider(EnclosureStore, {
        getPools: jest.fn(() => ['test_pool']),
      }),
      mockProvider(DiskTemperatureService, {
        getTemperature: of({}),
      }),
      mockProvider(ThemeService, {
        currentTheme: jest.fn(() => ({
          accentColors: ['blue', 'orange'],
          blue: 'blue',
          orange: 'orange',
          green: 'green',
        })),
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
          {
            selector: selectTheme,
            value: 'ix-dark',
          },
        ],
      }),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation();

    spectator = createComponent({
      props: {
        profile: {
          enclosureStore$: of({
            selectedEnclosure: 'enclosure1',
            enclosures,
          } as EnclosureState),
        } as SystemProfile,
        'current-tab': {
          alias: 'Disks',
        } as ViewConfig,
        'controller-events': new BehaviorSubject<EnclosureEvent>({
          name: 'CanvasExtract',
          data: enclosures[1],
          sender: {},
        }) as Subject<EnclosureEvent>,
      } as InferInputSignals<EnclosureDisksMiniComponent>,
    });

    const offsetParent = document.createElement('div');
    offsetParent.id = 'parent-id';

    spectator.component.selectedSlotNumber = 1;
    spectator.component.selectedDisk = enclosures[1].elements['Array Device Slot'][1];
    spectator.component.currentView = 'details';
    spectator.component.app.renderer.view = {
      ...spectator.component.app.renderer.view,
      offsetParent,
    };
    spectator.component.chassisView.slotRange = { start: 0, end: 2 };
    spectator.component.chassisView.driveTrayObjects = [driveTray];
    spectator.detectComponentChanges();
    spectator.component.setCurrentView('details');
  });

  it('shows title', () => {
    expect(spectator.query('.mat-card-title-text').textContent.trim()).toBe('Disks on MINI-3.0-X (1)');
  });
});
