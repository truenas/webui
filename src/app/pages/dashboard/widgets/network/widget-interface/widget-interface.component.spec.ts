import { fakeAsync } from '@angular/core/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { ChartData } from 'chart.js';
import { MockComponent } from 'ng-mocks';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { NetworkInterfaceType, NetworkInterfaceAliasType, LinkState } from 'app/enums/network-interface.enum';
import { InterfaceStatusIconComponent } from 'app/modules/interface-status-icon/interface-status-icon.component';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { NetworkSpeedPipe } from 'app/modules/pipes/network-speed/network-speed.pipe';
import { ThemeService } from 'app/modules/theme/theme.service';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { ByteChartComponent } from 'app/pages/dashboard/widgets/network/common/byte-chart/byte-chart.component';
import { WidgetInterfaceComponent } from 'app/pages/dashboard/widgets/network/widget-interface/widget-interface.component';

describe('WidgetInterfaceComponent', () => {
  let spectator: Spectator<WidgetInterfaceComponent>;

  const createComponent = createComponentFactory({
    component: WidgetInterfaceComponent,
    imports: [
      NgxSkeletonLoaderModule,
      NetworkSpeedPipe,
      WithLoadingStateDirective,
    ],
    declarations: [
      MockComponent(ByteChartComponent),
      MockComponent(InterfaceStatusIconComponent),
    ],
    providers: [
      mockProvider(WidgetResourcesService, {
        networkInterfaces$: of({
          value: [
            {
              id: '1',
              type: NetworkInterfaceType.Physical,
              name: 'ens1',
              aliases: [
                {
                  address: '192.168.238.12',
                  netmask: 24,
                  type: NetworkInterfaceAliasType.Inet,
                },
              ],
              state: {
                link_state: LinkState.Up,
                active_media_subtype: '100Mb/s MII',
                active_media_type: 'Ethernet',
                vlans: [],
                aliases: [],
              },
            },
          ],
          isLoading: false,
          error: null,
        }),
        networkInterfaceUpdatesWithStaleDetection: () => of({
          value: {
            ens1: {
              received_bytes_rate: 2048,
              sent_bytes_rate: 4096,
              link_state: LinkState.Up,
            },
          },
          isStale: false,
        }),
        networkInterfaceLastHourStats: jest.fn(() => of([
          {
            name: 'interface',
            identifier: 'ens1',
            data: [
              [0, 7728.161792, 992.3273728],
              [0, 8728.161792, 1992.3273728],
            ],
            legend: ['time', 'received', 'sent'],
            start: 0,
            end: 0,
          },
        ])),
      }),
      mockProvider(ThemeService, {
        currentTheme: jest.fn(() => ({
          blue: 'blue',
          orange: 'orange',
        })),
      }),
    ],
  });

  describe('Full Size', () => {
    global.Date.now = jest.fn(() => (new Date('2024-07-23')).getTime()); // 1721689140000
    beforeEach(() => {
      spectator = createComponent({
        props: {
          size: SlotSize.Full,
          settings: {
            interface: 'ens1',
          },
        },
      });
    });

    it('shows widget header', fakeAsync(() => {
      spectator.tick(1);
      expect(spectator.query('.header')).toHaveText('Interface');
    }));

    it('shows interface name', fakeAsync(() => {
      spectator.tick(1);
      expect(spectator.query('.info-header-title')).toHaveText('ens1');
    }));

    it('shows interface state', fakeAsync(() => {
      spectator.tick(1);
      expect(spectator.query('.info-list-item.state')).toHaveText('LINK STATE UP');
    }));

    it('shows interface traffic', fakeAsync(() => {
      spectator.tick(1);
      expect(spectator.query('.info-list-item.in')).toHaveText('In:2 KiB/s');
      expect(spectator.query('.info-list-item.out')).toHaveText('Out:4 KiB/s');
    }));

    it('shows a chart with network traffic', () => {
      const chart = spectator.query(ByteChartComponent)!;
      expect(chart).not.toBeNull();

      const data = (chart as unknown as Element & { data: ChartData<'line'> }).data;
      expect(data.datasets).toHaveLength(2);
      expect(data.datasets[0].label).toBe('Incoming [ens1]');
      expect(data.datasets[0].data).toHaveLength(3);
      expect((data.datasets[0].data[0] as { x: number; y: number }).y).toBeCloseTo(966020.224, 1);
      expect((data.datasets[0].data[1] as { x: number; y: number }).y).toBeCloseTo(1091020.224, 1);
      expect((data.datasets[0].data[2] as { x: number; y: number }).y).toBe(2048);

      expect(data.datasets[1].label).toBe('Outgoing [ens1]');
      expect(data.datasets[1].data).toHaveLength(3);
      expect((data.datasets[1].data[0] as { x: number; y: number }).y).toBeCloseTo(-124040.9216, 1);
      expect((data.datasets[1].data[1] as { x: number; y: number }).y).toBeCloseTo(-249040.9216, 1);
      expect((data.datasets[1].data[2] as { x: number; y: number }).y).toBe(-4096);
    });

    it('checks first entry selection when settings are null', () => {
      spectator.setInput('settings', null);
      spectator.detectChanges();

      expect(spectator.query('.info-header-title')).toHaveText('ens1');
      expect(spectator.query('.info-list-item.state')).toHaveText('LINK STATE UP');
      expect(spectator.query('.info-list-item.in')).toHaveText('In:2 KiB/s');
      expect(spectator.query('.info-list-item.out')).toHaveText('Out:4 KiB/s');
    });
  });

  describe('Half Size', () => {
    beforeEach(() => {
      global.Date.now = jest.fn(() => (new Date('2024-07-23')).getTime()); // 1721689140000
      spectator = createComponent({
        props: {
          size: SlotSize.Half,
          settings: {
            interface: 'ens1',
          },
        },
      });
    });

    it('ensures no widget header is rendered', () => {
      expect(spectator.query('.header')).toBeNull();
    });

    it('shows interface name', fakeAsync(() => {
      spectator.tick(1);
      expect(spectator.query('.info-header-title')).toHaveText('ens1');
    }));

    it('shows interface state', fakeAsync(() => {
      spectator.tick(1);
      expect(spectator.query('.info-list-item.state')).toHaveText('LINK STATE UP');
    }));

    it('shows interface traffic', fakeAsync(() => {
      spectator.tick(1);
      expect(spectator.query('.info-list-item.in')).toHaveText('In:2 KiB/s');
      expect(spectator.query('.info-list-item.out')).toHaveText('Out:4 KiB/s');
    }));

    it('shows a chart with network traffic', () => {
      const chart = spectator.query(ByteChartComponent)!;
      expect(chart).not.toBeNull();

      const data = (chart as unknown as Element & { data: ChartData<'line'> }).data;
      expect(data.datasets).toHaveLength(2);
      expect(data.datasets[0].label).toBe('Incoming [ens1]');
      expect(data.datasets[0].data).toHaveLength(3);
      expect((data.datasets[0].data[0] as { x: number; y: number }).y).toBeCloseTo(966020.224, 1);
      expect((data.datasets[0].data[1] as { x: number; y: number }).y).toBeCloseTo(1091020.224, 1);
      expect((data.datasets[0].data[2] as { x: number; y: number }).y).toBe(2048);

      expect(data.datasets[1].label).toBe('Outgoing [ens1]');
      expect(data.datasets[1].data).toHaveLength(3);
      expect((data.datasets[1].data[0] as { x: number; y: number }).y).toBeCloseTo(-124040.9216, 1);
      expect((data.datasets[1].data[1] as { x: number; y: number }).y).toBeCloseTo(-249040.9216, 1);
      expect((data.datasets[1].data[2] as { x: number; y: number }).y).toBe(-4096);
    });
  });

  describe('Quarter Size', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          size: SlotSize.Quarter,
          settings: {
            interface: 'ens1',
          },
        },
      });
    });

    it('ensures no widget header is rendered', () => {
      expect(spectator.query('.header')).toBeNull();
    });

    it('shows interface name', fakeAsync(() => {
      spectator.tick(1);
      expect(spectator.query('.info-header-title')).toHaveText('ens1');
    }));

    it('shows interface state', fakeAsync(() => {
      spectator.tick(1);
      expect(spectator.query('.info-list-item.state')).toHaveText('LINK STATE UP');
    }));

    it('shows interface traffic', fakeAsync(() => {
      spectator.tick(1);
      expect(spectator.query('.info-list-item.in')).toHaveText('In:2 KiB/s');
      expect(spectator.query('.info-list-item.out')).toHaveText('Out:4 KiB/s');
    }));

    it('ensures chart is not rendered', fakeAsync(() => {
      spectator.tick(1);
      const chart = spectator.query(ByteChartComponent);
      expect(chart).toBeNull();
    }));
  });
});
