import { signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { EnclosureDiskStatus } from 'app/enums/enclosure-slot-status.enum';
import { VdevType } from 'app/enums/v-dev-type.enum';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { EnclosureHeaderComponent } from 'app/pages/system/enclosure/components/enclosure-header/enclosure-header.component';
import { DisksOverviewComponent, EnclosureView } from 'app/pages/system/enclosure/components/views/enclosure-view/disks-overview/disks-overview.component';
import { IxEnclosureSelectorComponent } from 'app/pages/system/enclosure/components/views/enclosure-view/enclosure-selector/enclosure-selector.component';
import { EnclosureViewComponent } from 'app/pages/system/enclosure/components/views/enclosure-view/enclosure-view.component';
import { M50EnclosureComponent } from 'app/pages/system/enclosure/components/views/enclosure-view/enclosures/m50-enclosure/m50-enclosure.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

const fakeDeviceSlot: DashboardEnclosureSlot = {
  descriptor: 'slot00',
  status: 'OK',
  model: 'HUH721212AL4200',
  dev: 'sdb',
  is_front: true,
  is_rear: false,
  is_top: false,
  is_internal: false,
  pool_info: {
    pool_name: 'sanity',
    disk_status: EnclosureDiskStatus.Online,
    vdev_name: 'mirror-0',
    vdev_type: VdevType.Data,
    vdev_disks: [
      {
        enclosure_id: '5b0bd6d1a309b47f',
        slot: 1,
        dev: 'sdb',
      },
      {
        enclosure_id: '5b0bd6d1a309b47f',
        slot: 2,
        dev: 'sda',
      },
    ],
  },
};

const enclosures = [
  {
    name: 'iX 4024Sp e001',
    model: 'M50',
    controller: true,
    dmi: 'TRUENAS-M50-HA',
    status: [
      'OK',
    ],
    id: '5b0bd6d1a309b47f',
    vendor: 'iX',
    product: '4024Sp',
    revision: 'e001',
    bsg: '/dev/bsg/18:0:2:0',
    sg: '/dev/sg4',
    pci: '18:0:2:0',
    rackmount: true,
    top_loaded: false,
    front_slots: 24,
    rear_slots: 4,
    internal_slots: 0,
    elements: {
      'Array Device Slot': {
        1: {
          descriptor: 'slot00',
          status: 'OK',
          dev: 'sdb',
          pool_info: {
            pool_name: 'sanity',
            disk_status: 'ONLINE',
            vdev_name: 'mirror-0',
            vdev_type: 'data',
            vdev_disks: [
              {
                enclosure_id: '5b0bd6d1a309b47f',
                slot: 1,
                dev: 'sdb',
              },
              {
                enclosure_id: '5b0bd6d1a309b47f',
                slot: 2,
                dev: 'sda',
              },
            ],
          },
        },
        2: {
          descriptor: 'slot01',
          status: 'OK',
          dev: 'sda',
          pool_info: {
            pool_name: 'sanity',
            disk_status: 'ONLINE',
            vdev_name: 'mirror-0',
            vdev_type: 'data',
            vdev_disks: [
              {
                enclosure_id: '5b0bd6d1a309b47f',
                slot: 1,
                dev: 'sdb',
              },
              {
                enclosure_id: '5b0bd6d1a309b47f',
                slot: 2,
                dev: 'sda',
              },
            ],
          },
        },
        3: {
          descriptor: 'slot02',
          status: 'Not installed',
          dev: null as string,
          pool_info: null as object,
        },
        4: {
          descriptor: 'slot03',
          status: 'Not installed',
          dev: null as string,
          pool_info: null as object,
        },
        5: {
          descriptor: 'slot04',
          status: 'Not installed',
          dev: null as string,
          pool_info: null as object,
        },
        6: {
          descriptor: 'slot05',
          status: 'Not installed',
          dev: null as string,
          pool_info: null as object,
        },
        7: {
          descriptor: 'slot06',
          status: 'Not installed',
          dev: null as string,
          pool_info: null as object,
        },
        8: {
          descriptor: 'slot07',
          status: 'Not installed',
          dev: null as string,
          pool_info: null as object,
        },
        9: {
          descriptor: 'slot08',
          status: 'Not installed',
          dev: null as string,
          pool_info: null as object,
        },
        10: {
          descriptor: 'slot09',
          status: 'Not installed',
          dev: null as string,
          pool_info: null as object,
        },
        11: {
          descriptor: 'slot10',
          status: 'Not installed',
          dev: null as string,
          pool_info: null as object,
        },
        12: {
          descriptor: 'slot11',
          status: 'Not installed',
          dev: null as string,
          pool_info: null as object,
        },
        13: {
          descriptor: 'slot12',
          status: 'Not installed',
          dev: null as string,
          pool_info: null as object,
        },
        14: {
          descriptor: 'slot13',
          status: 'Not installed',
          dev: null as string,
          pool_info: null as object,
        },
        15: {
          descriptor: 'slot14',
          status: 'Not installed',
          dev: null as string,
          pool_info: null as object,
        },
        16: {
          descriptor: 'slot15',
          status: 'Not installed',
          dev: null as string,
          pool_info: null as object,
        },
        17: {
          descriptor: 'slot16',
          status: 'Not installed',
          dev: null as string,
          pool_info: null as object,
        },
        18: {
          descriptor: 'slot17',
          status: 'Not installed',
          dev: null as string,
          pool_info: null as object,
        },
        19: {
          descriptor: 'slot18',
          status: 'Not installed',
          dev: null as string,
          pool_info: null as object,
        },
        20: {
          descriptor: 'slot19',
          status: 'Not installed',
          dev: null as string,
          pool_info: null as object,
        },
        21: {
          descriptor: 'slot20',
          status: 'Not installed',
          dev: null as string,
          pool_info: null as object,
        },
        22: {
          descriptor: 'slot21',
          status: 'Not installed',
          dev: null as string,
          pool_info: null as object,
        },
        23: {
          descriptor: 'slot22',
          status: 'Not installed',
          dev: null as string,
          pool_info: null as object,
        },
        24: {
          descriptor: 'slot23',
          status: 'Not installed',
          dev: null as string,
          pool_info: null as object,
        },
        25: {
          descriptor: 'Disk #1',
          status: 'Not installed',
          dev: null as string,
          pool_info: null as object,
        },
        26: {
          descriptor: 'Disk #2',
          status: 'Not installed',
          dev: null as string,
          pool_info: null as object,
        },
        27: {
          descriptor: 'Disk #3',
          status: 'Not installed',
          dev: null as string,
          pool_info: null as object,
        },
        28: {
          descriptor: 'Disk #4',
          status: 'Not installed',
          dev: null as string,
          pool_info: null as object,
        },
      },
      'SAS Expander': {
        26: {
          descriptor: 'SAS3 Expander',
          status: 'OK',
          value: null as string,
          value_raw: 16777216,
        },
      },
      Enclosure: {
        28: {
          descriptor: 'Encl-BpP',
          status: 'OK, Swapped',
          value: null as string,
          value_raw: 285212672,
        },
        29: {
          descriptor: 'Encl-PeerS',
          status: 'OK',
          value: null as string,
          value_raw: 16777216,
        },
      },
      'Temperature Sensors': {
        31: {
          descriptor: 'ExpP-Die',
          status: 'OK',
          value: '37C',
          value_raw: 16791808,
        },
        32: {
          descriptor: 'ExpS-Die',
          status: 'OK',
          value: '35C',
          value_raw: 16791296,
        },
        33: {
          descriptor: 'Sense BP1',
          status: 'OK',
          value: '21C',
          value_raw: 16787712,
        },
        34: {
          descriptor: 'Sense BP2',
          status: 'OK',
          value: '20C',
          value_raw: 16787456,
        },
      },
      'Voltage Sensor': {
        36: {
          descriptor: '5V Sensor',
          status: 'OK',
          value: '5.1V',
          value_raw: 16777726,
        },
        37: {
          descriptor: '12V Sensor',
          status: 'OK',
          value: '12.25V',
          value_raw: 16778441,
        },
      },
    },
    label: 'iX 4024Sp e001',
  },
  {
    name: 'CELESTIC X2012-MT 0443',
    model: 'ES12',
    controller: false,
    dmi: 'TRUENAS-M50-HA',
    status: [
      'OK',
    ],
    id: '500e0eca0651517f',
    vendor: 'CELESTIC',
    product: 'X2012-MT',
    revision: '0443',
    bsg: '/dev/bsg/20:0:0:0',
    sg: '/dev/sg6',
    pci: '20:0:0:0',
    rackmount: true,
    top_loaded: false,
    front_slots: 12,
    rear_slots: 0,
    internal_slots: 0,
    elements: {
      'Array Device Slot': {
        1: {
          descriptor: 'Drive Slot #0_0000000000000000',
          status: 'Not installed',
          dev: null as string,
          pool_info: null as object,
        },
        2: {
          descriptor: 'Drive Slot #1_0000000000000000',
          status: 'Not installed',
          dev: null as string,
          pool_info: null as object,
        },
        3: {
          descriptor: 'Drive Slot #2_0000000000000000',
          status: 'Not installed',
          dev: null as string,
          pool_info: null as object,
        },
        4: {
          descriptor: 'Drive Slot #3_0000000000000000',
          status: 'Not installed',
          dev: null as string,
          pool_info: null as object,
        },
        5: {
          descriptor: 'Drive Slot #4_0000000000000000',
          status: 'Not installed',
          dev: null as string,
          pool_info: null as object,
        },
        6: {
          descriptor: 'Drive Slot #5_0000000000000000',
          status: 'Not installed',
          dev: null as string,
          pool_info: null as object,
        },
        7: {
          descriptor: 'Drive Slot #6_0000000000000000',
          status: 'Not installed',
          dev: null as string,
          pool_info: null as object,
        },
        8: {
          descriptor: 'Drive Slot #7_0000000000000000',
          status: 'Not installed',
          dev: null as string,
          pool_info: null as object,
        },
        9: {
          descriptor: 'Drive Slot #8_0000000000000000',
          status: 'Not installed',
          dev: null as string,
          pool_info: null as object,
        },
        10: {
          descriptor: 'Drive Slot #9_0000000000000000',
          status: 'Not installed',
          dev: null as string,
          pool_info: null as object,
        },
        11: {
          descriptor: 'Drive Slot #10_0000000000000000',
          status: 'Not installed',
          dev: null as string,
          pool_info: null as object,
        },
        12: {
          descriptor: 'Drive Slot #11_0000000000000000',
          status: 'Not installed',
          dev: null as string,
          pool_info: null as object,
        },
      },
      'Power Supply': {
        13: {
          descriptor: 'Power Supply',
          status: 'OK',
          value: null as string,
          value_raw: 16777216,
        },
        14: {
          descriptor: 'PS A_0121',
          status: 'OK',
          value: 'RQST on',
          value_raw: 16777248,
        },
        15: {
          descriptor: 'PS B_0121',
          status: 'OK',
          value: 'RQST on',
          value_raw: 16777248,
        },
      },
      Cooling: {
        16: {
          descriptor: 'Cooling',
          status: 'OK',
          value: '0 RPM',
          value_raw: 16777216,
        },
        17: {
          descriptor: 'Virtual Fan Group #1_PS A',
          status: 'OK',
          value: '5380 RPM',
          value_raw: 16914945,
        },
        18: {
          descriptor: 'Virtual Fan Group #2_PS B',
          status: 'OK',
          value: '5300 RPM',
          value_raw: 16912897,
        },
        19: {
          descriptor: 'Fan #1_Virtual Fan Group #1',
          status: 'OK',
          value: '6200 RPM',
          value_raw: 16935937,
        },
        20: {
          descriptor: 'Fan #2_Virtual Fan Group #1',
          status: 'OK',
          value: '4600 RPM',
          value_raw: 16894977,
        },
        21: {
          descriptor: 'Fan #3_Virtual Fan Group #1',
          status: 'OK',
          value: '6200 RPM',
          value_raw: 16935937,
        },
        22: {
          descriptor: 'Fan #4_Virtual Fan Group #1',
          status: 'OK',
          value: '4700 RPM',
          value_raw: 16897537,
        },
        23: {
          descriptor: 'Fan #5_Virtual Fan Group #1',
          status: 'OK',
          value: '6100 RPM',
          value_raw: 16933377,
        },
        24: {
          descriptor: 'Fan #6_Virtual Fan Group #1',
          status: 'OK',
          value: '4500 RPM',
          value_raw: 16892417,
        },
        25: {
          descriptor: 'Fan #1_Virtual Fan Group #2',
          status: 'OK',
          value: '6000 RPM',
          value_raw: 16930817,
        },
        26: {
          descriptor: 'Fan #2_Virtual Fan Group #2',
          status: 'OK',
          value: '4500 RPM',
          value_raw: 16892417,
        },
        27: {
          descriptor: 'Fan #3_Virtual Fan Group #2',
          status: 'OK',
          value: '6100 RPM',
          value_raw: 16933377,
        },
        28: {
          descriptor: 'Fan #4_Virtual Fan Group #2',
          status: 'OK',
          value: '4700 RPM',
          value_raw: 16897537,
        },
        29: {
          descriptor: 'Fan #5_Virtual Fan Group #2',
          status: 'OK',
          value: '6100 RPM',
          value_raw: 16933377,
        },
        30: {
          descriptor: 'Fan #6_Virtual Fan Group #2',
          status: 'OK',
          value: '4400 RPM',
          value_raw: 16889857,
        },
      },
      'Temperature Sensors': {
        31: {
          descriptor: 'Temperature Sensor',
          status: 'OK',
          value: null as string,
          value_raw: 16777216,
        },
        32: {
          descriptor: 'Inlet Temperature_ESM A',
          status: 'OK',
          value: '20C',
          value_raw: 16787456,
        },
        33: {
          descriptor: 'Outlet Temperature_ESM A',
          status: 'OK',
          value: '20C',
          value_raw: 16787456,
        },
        34: {
          descriptor: 'SXP Temperature_ESM A',
          status: 'OK',
          value: '26C',
          value_raw: 16788992,
        },
        35: {
          descriptor: 'Inlet Temperature_ESM B',
          status: 'OK',
          value: '20C',
          value_raw: 16787456,
        },
        36: {
          descriptor: 'Outlet Temperature_ESM B',
          status: 'OK',
          value: '21C',
          value_raw: 16787712,
        },
        37: {
          descriptor: 'SXP Temperature_ESM B',
          status: 'OK',
          value: '25C',
          value_raw: 16788736,
        },
        38: {
          descriptor: 'Hotspot Temperature_PS A',
          status: 'OK',
          value: '34C',
          value_raw: 16791040,
        },
        39: {
          descriptor: 'Ambient Temperature_PS A',
          status: 'OK',
          value: '22C',
          value_raw: 16787968,
        },
        40: {
          descriptor: 'Primary Temperature_PS A',
          status: 'OK',
          value: '20C',
          value_raw: 16787456,
        },
        41: {
          descriptor: 'Hotspot Temperature_PS B',
          status: 'OK',
          value: '34C',
          value_raw: 16791040,
        },
        42: {
          descriptor: 'Ambient Temperature_PS B',
          status: 'OK',
          value: '21C',
          value_raw: 16787712,
        },
        43: {
          descriptor: 'Primary Temperature_PS B',
          status: 'OK',
          value: '20C',
          value_raw: 16787456,
        },
      },
      'Enclosure Services Controller Electronics': {
        44: {
          descriptor: 'ESM',
          status: 'OK',
          value: null as string,
          value_raw: 16777216,
        },
        45: {
          descriptor: 'ESM A_500E0ECA06515100',
          status: 'OK',
          value: null as string,
          value_raw: 16777600,
        },
        46: {
          descriptor: 'ESM B_500E0ECA06515140',
          status: 'OK',
          value: null as string,
          value_raw: 16777600,
        },
      },
      Enclosure: {
        47: {
          descriptor: 'EL LOBO Enclosure',
          status: 'OK',
          value: null as string,
          value_raw: 16777216,
        },
        48: {
          descriptor: 'EL LOBO Enclosure',
          status: 'OK',
          value: null as string,
          value_raw: 16777216,
        },
      },
      'Voltage Sensor': {
        49: {
          descriptor: 'Voltage Sensor',
          status: 'OK',
          value: '0.0V',
          value_raw: 16777216,
        },
        50: {
          descriptor: '0.92V Voltage_ESM A',
          status: 'OK',
          value: '0.93V',
          value_raw: 16777309,
        },
        51: {
          descriptor: '1.0V Voltage_ESM A',
          status: 'OK',
          value: '1.0V',
          value_raw: 16777316,
        },
        52: {
          descriptor: '1.8V Voltage_ESM A',
          status: 'OK',
          value: '1.8V',
          value_raw: 16777396,
        },
        53: {
          descriptor: '3.3V Voltage_ESM A',
          status: 'OK',
          value: '3.31V',
          value_raw: 16777547,
        },
        54: {
          descriptor: '0.92V Voltage_ESM B',
          status: 'OK',
          value: '0.92V',
          value_raw: 16777308,
        },
        55: {
          descriptor: '1.0V Voltage_ESM B',
          status: 'OK',
          value: '0.99V',
          value_raw: 16777315,
        },
        56: {
          descriptor: '1.8V Voltage_ESM B',
          status: 'OK',
          value: '1.77V',
          value_raw: 16777393,
        },
        57: {
          descriptor: '3.3V Voltage_ESM B',
          status: 'OK',
          value: '3.28V',
          value_raw: 16777544,
        },
      },
      'SAS Expander': {
        58: {
          descriptor: 'SXP Expander',
          status: 'OK',
          value: null as string,
          value_raw: 16777216,
        },
        59: {
          descriptor: 'SXP',
          status: 'OK',
          value: null as string,
          value_raw: 16777216,
        },
        60: {
          descriptor: 'SXP',
          status: 'OK',
          value: null as string,
          value_raw: 16777216,
        },
      },
      'SAS Connector': {
        61: {
          descriptor: 'SAS Connector',
          status: 'OK',
          value: 'No information',
          value_raw: 16777216,
        },
        62: {
          descriptor: 'Connector #1_ESM A',
          status: 'OK',
          value: 'Mini SAS HD 4x receptacle (SFF-8644) [max 4 phys]',
          value_raw: 17170176,
        },
        63: {
          descriptor: 'Connector #2_ESM A',
          status: 'OK',
          value: 'Mini SAS HD 4x receptacle (SFF-8644) [max 4 phys]',
          value_raw: 17170176,
        },
        64: {
          descriptor: 'Connector #3_ESM A',
          status: 'OK',
          value: 'Mini SAS HD 4x receptacle (SFF-8644) [max 4 phys]',
          value_raw: 17170176,
        },
        65: {
          descriptor: 'Connector #1_ESM B',
          status: 'OK',
          value: 'Mini SAS HD 4x receptacle (SFF-8644) [max 4 phys]',
          value_raw: 17170176,
        },
        66: {
          descriptor: 'Connector #2_ESM B',
          status: 'OK',
          value: 'Mini SAS HD 4x receptacle (SFF-8644) [max 4 phys]',
          value_raw: 17170176,
        },
        67: {
          descriptor: 'Connector #3_ESM B',
          status: 'OK',
          value: 'Mini SAS HD 4x receptacle (SFF-8644) [max 4 phys]',
          value_raw: 17170176,
        },
      },
    },
    label: 'CELESTIC X2012-MT 0443',
  },
];

describe('EnclosureViewComponent', () => {
  let spectator: Spectator<EnclosureViewComponent>;

  const createComponent = createComponentFactory({
    component: EnclosureViewComponent,
    declarations: [
      MockComponent(M50EnclosureComponent),
      MockComponent(DisksOverviewComponent),
      MockComponent(IxEnclosureSelectorComponent),
      MockComponent(EnclosureHeaderComponent),
    ],
    imports: [
      MatCardModule,
    ],
    providers: [
      mockProvider(EnclosureStore, {
        selectedEnclosure: signal({ ...enclosures[0] }),
        enclosures: signal(enclosures),
        selectedSlot: signal(fakeDeviceSlot),
        enclosureLabel: signal(enclosures[0].model || enclosures[0].label),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('renders disk overview component', () => {
    jest.spyOn(spectator.component, 'changeView');
    const disksOverview = spectator.query(DisksOverviewComponent);
    expect(disksOverview).toExist();
    disksOverview.viewChanged.emit(EnclosureView.FailedDisks);
    expect(spectator.component.changeView).toHaveBeenCalledWith(EnclosureView.FailedDisks);
  });
  it('renders enclosure selector', () => {
    const selector = spectator.query(IxEnclosureSelectorComponent);
    expect(selector).toExist();
  });
  it('renders m50 enclosure', () => {
    expect(spectator.query(M50EnclosureComponent)).toExist();
  });
});
