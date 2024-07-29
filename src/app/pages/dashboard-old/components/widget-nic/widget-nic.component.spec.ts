import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatGridListModule } from '@angular/material/grid-list';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { LinkState, NetworkInterfaceType } from 'app/enums/network-interface.enum';
import { ViewChartAreaComponent } from 'app/modules/charts/components/view-chart-area/view-chart-area.component';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { InterfaceStatusIconComponent } from 'app/modules/interface-status-icon/interface-status-icon.component';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { NetworkSpeedPipe } from 'app/modules/pipes/network-speed/network-speed.pipe';
import { DragHandleComponent } from 'app/pages/dashboard-old/components/drag-handle/drag-handle.component';
import { WidgetNicComponent } from 'app/pages/dashboard-old/components/widget-nic/widget-nic.component';
import { ResourcesUsageStore } from 'app/pages/dashboard-old/store/resources-usage-store.service';

describe('WidgetNicComponent', () => {
  let spectator: Spectator<WidgetNicComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: WidgetNicComponent,
    imports: [
      NgxSkeletonLoaderModule,
      MatGridListModule,
      FileSizePipe,
      NetworkSpeedPipe,
    ],
    declarations: [
      MockComponent(DragHandleComponent),
      MockComponent(ViewChartAreaComponent),
      MockComponent(EmptyComponent),
      MockComponent(InterfaceStatusIconComponent),
    ],
    providers: [
      mockAuth(),
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
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        nic: 'eth0',
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('checks widget title', () => {
    expect(spectator.query('.card-title-text')).toHaveText('Interface');
  });

  it('checks back button', async () => {
    jest.spyOn(spectator.component, 'goBack');

    const backButton = await loader.getHarness(IxIconHarness.with({ name: 'chevron_left' }));
    await backButton.click();

    expect(spectator.component.goBack).toHaveBeenCalled();
  });

  // TODO: Add more tests
});
