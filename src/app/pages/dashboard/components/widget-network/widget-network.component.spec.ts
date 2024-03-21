import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatGridListModule } from '@angular/material/grid-list';
import { Spectator } from '@ngneat/spectator';
import { createHostFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponent } from 'ng-mocks';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { DragHandleComponent } from 'app/core/components/drag-handle/drag-handle.component';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { LinkState, NetworkInterfaceType } from 'app/enums/network-interface.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { ViewChartAreaComponent } from 'app/modules/charts/components/view-chart-area/view-chart-area.component';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { InterfaceStatusIconComponent } from 'app/modules/interface-status-icon/interface-status-icon.component';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { WidgetNetworkComponent } from 'app/pages/dashboard/components/widget-network/widget-network.component';
import { ResourcesUsageStore } from 'app/pages/dashboard/store/resources-usage-store.service';
import { LocaleService } from 'app/services/locale.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { selectPreferences, selectTheme } from 'app/store/preferences/preferences.selectors';
import { selectTimezone } from 'app/store/system-config/system-config.selectors';
import { selectSystemInfo } from 'app/store/system-info/system-info.selectors';

describe('WidgetNetworkComponent', () => {
  let spectator: Spectator<WidgetNetworkComponent>;
  let loader: HarnessLoader;

  const createHost = createHostFactory({
    component: WidgetNetworkComponent,
    imports: [
      NgxSkeletonLoaderModule,
      MatGridListModule,
    ],
    declarations: [
      MockComponent(DragHandleComponent),
      MockComponent(ViewChartAreaComponent),
      MockComponent(EmptyComponent),
      MockComponent(InterfaceStatusIconComponent),
    ],
    providers: [
      mockAuth(),
      mockWebSocket([
        mockCall('reporting.netdata_get_data'),
        mockCall('reporting.clear'),
      ]),
      mockProvider(SystemGeneralService, {
        isEnterprise: () => true,
        getProductType$: of(ProductType.Scale),
      }),
      mockProvider(ResourcesUsageStore, {
        nics$: of([{
          name: 'eth0',
          type: NetworkInterfaceType.Physical,
          state: {
            name: 'eth0',
            link_state: LinkState.Up,
            aliases: [],
          },
        }, {
          name: 'eth1',
          type: NetworkInterfaceType.Physical,
          state: {
            name: 'eth1',
            link_state: LinkState.Up,
            aliases: [],
          },
        }]),
        interfacesUsage$: of({
          eth0: {
            link_state: 'LINK_STATE_UP',
            speed: 1000,
            received_bytes_rate: 2038,
            sent_bytes_rate: 21284,
          },
          eth1: {
            link_state: 'LINK_STATE_UP',
            speed: 1000,
            received_bytes_rate: 2038,
            sent_bytes_rate: 21284,
          },
        }),
      }),
      mockProvider(LocaleService),
      provideMockStore({
        selectors: [{
          selector: selectPreferences,
          value: {
            timezone: 'Europe/London',
          },
        }, {
          selector: selectSystemInfo,
          value: {
            datetime: {
              $date: 1234567,
            },
          },
        }, {
          selector: selectTheme,
          value: 'ix-dark',
        }, {
          selector: selectTimezone,
          value: 'Europe/London',
        }],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createHost('<ix-widget-network></ix-widget-network>');
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('checks widget title', () => {
    expect(spectator.query('.card-title-text')).toHaveText('Network');
  });

  it.skip('checks back button', async () => {
    jest.spyOn(spectator.component, 'goBack');

    const backButton = await loader.getHarness(IxIconHarness.with({ name: 'chevron_left' }));
    await backButton.click();

    expect(spectator.component.goBack).toHaveBeenCalled();
  });

  // TODO: Add more tests
});
