import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { NetworkInterfaceType, NetworkInterfaceAliasType } from 'app/enums/network-interface.enum';
import { ViewChartAreaComponent } from 'app/modules/charts/components/view-chart-area/view-chart-area.component';
import { InterfaceStatusIconComponent } from 'app/modules/interface-status-icon/interface-status-icon.component';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetNetworkComponent } from 'app/pages/dashboard/widgets/network/widget-network/widget-network.component';
import { LocaleService } from 'app/services/locale.service';
import { ThemeService } from 'app/services/theme/theme.service';

describe('WidgetNetworkComponent', () => {
  let spectator: Spectator<WidgetNetworkComponent>;
  const createComponent = createComponentFactory({
    component: WidgetNetworkComponent,
    imports: [NgxSkeletonLoaderModule],
    declarations: [
      MockComponent(ViewChartAreaComponent),
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
                link_state: 'LINK_STATE_UP',
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
        realtimeUpdates$: of({
          fields: {
            interfaces: {
              ens1: {},
            },
          },
        }),
        networkInterfaceUpdate: jest.fn(() => of([
          {
            name: 'interface',
            identifier: 'ens1',
            data: [[7728.161792, 992.3273728]],
            legend: ['time', 'received', 'sent'],
            start: 1714583020,
            end: 1714586620,
            aggregations: {
              min: {
                received: 0,
                sent: 0.3679756,
              },
              mean: {
                received: 2.9719816804221155,
                sent: 29.53915262221609,
              },
              max: {
                received: 68.91254,
                sent: 258.6983,
              },
            },
          },
        ])),
      }),
      mockProvider(ThemeService, {
        currentTheme: jest.fn(() => ({
          blue: 'blue',
          orange: 'orange',
        })),
      }),
      mockProvider(LocaleService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        size: SlotSize.Full,
      },
    });
  });

  it('shows widget header', () => {
    expect(spectator.query('.header')).toHaveText('Network');
  });

  it('shows interface name', () => {
    expect(spectator.query('.info-header-title')).toHaveText('ens1');
  });

  // TODO: More tests will be added soon
});
