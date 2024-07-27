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
import { EnclosureDisksComponent } from 'app/pages/system/old-view-enclosure/components/enclosure-disks/enclosure-disks.component';
import { SystemProfile } from 'app/pages/system/old-view-enclosure/components/view-enclosure/view-enclosure.component';
import { EnclosureEvent } from 'app/pages/system/old-view-enclosure/interfaces/enclosure-events.interface';
import { OldEnclosure } from 'app/pages/system/old-view-enclosure/interfaces/old-enclosure.interface';
import { ViewConfig } from 'app/pages/system/old-view-enclosure/interfaces/view.config';
import { EnclosureState, EnclosureStore } from 'app/pages/system/old-view-enclosure/stores/enclosure-store.service';
import { DiskTemperatureService } from 'app/services/disk-temperature.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { WebSocketService } from 'app/services/ws.service';
import { PreferencesState } from 'app/store/preferences/preferences.reducer';
import { selectPreferencesState, selectTheme } from 'app/store/preferences/preferences.selectors';

Object.defineProperty(PIXI, '', {});

describe('EnclosureDisksComponent', () => {
  let spectator: Spectator<EnclosureDisksComponent>;

  const enclosures: OldEnclosure[] = [
    {
      number: 0,
      id: 'enclosure0',
      label: 'Test enclosure 0',
      model: 'H10',
      elements: {},
    },
    {
      number: 1,
      id: 'enclosure1',
      label: 'Test enclosure 1',
      model: 'R50',
      elements: {
        'Array Device Slot': {
          1: {
            pool_info: {
              pool_name: 'test_pool',
              vdev_disks: [],
              disk_status: EnclosureDiskStatus.Online,
            },
            dev: 'sda',
            supports_identify_light: true,
          } as DashboardEnclosureSlot,
        },
      },
    },
  ] as OldEnclosure[];

  const driveTray = new DriveTray('R50', new PIXI.loaders.Loader());
  driveTray.container = new PIXI.Container();
  driveTray.id = '1';

  const createComponent = createComponentFactory({
    component: EnclosureDisksComponent,
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
        getTemperature: () => of({}),
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
      } as InferInputSignals<EnclosureDisksComponent>,
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
    expect(spectator.query('.mat-card-title-text').textContent.trim()).toBe('Disks on Test enclosure 1 (1)');
  });

  it('sets slot status when toggleSlotStatus is called', () => {
    spectator.component.toggleSlotStatus();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith(
      'enclosure.set_slot_status',
      ['enclosure1', 1, 'IDENTIFY'],
    );
  });

  it('sets disks status when setDisksHealthState is called', () => {
    jest.spyOn(spectator.component.chassisView.events, 'next').mockImplementation();
    spectator.component.setDisksHealthState();

    expect(spectator.component.chassisView.events.next).toHaveBeenCalledWith({
      name: 'ChangeDriveTrayColor',
      data: {
        id: '1',
        slot: 1,
        enclosure: 'enclosure1',
        color: 'green',
      },
    });
  });

  it('sets currentView when chassisView event occurred', (() => {
    jest.spyOn(spectator.component, 'setCurrentView').mockImplementation();

    jest.spyOn(spectator.component.chassisView.events, 'pipe')
      .mockImplementationOnce(() => of({ name: 'Ready' }));
    spectator.component.chassisView.events.next({ name: 'Ready' });
    expect(spectator.component.setCurrentView).toHaveBeenCalledWith('pools');

    jest.spyOn(spectator.component.chassisView.events, 'pipe')
      .mockImplementationOnce(() => of({ name: 'DriveSelected' }));
    spectator.component.chassisView.events.next({ name: 'DriveSelected', data: driveTray });
    expect(spectator.component.setCurrentView).toHaveBeenCalledWith('details');
  }));
});
