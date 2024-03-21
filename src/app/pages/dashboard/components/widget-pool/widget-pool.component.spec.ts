import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createHostFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { DragHandleComponent } from 'app/core/components/drag-handle/drag-handle.component';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Pool } from 'app/interfaces/pool.interface';
import { VolumeData } from 'app/interfaces/volume-data.interface';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { WidgetPoolComponent } from 'app/pages/dashboard/components/widget-pool/widget-pool.component';
import { ResourcesUsageStore } from 'app/pages/dashboard/store/resources-usage-store.service';

describe('WidgetPoolComponent', () => {
  let spectator: Spectator<WidgetPoolComponent>;
  let loader: HarnessLoader;

  const createHost = createHostFactory({
    component: WidgetPoolComponent,
    imports: [
      NgxSkeletonLoaderModule,
    ],
    declarations: [
      MockComponent(DragHandleComponent),
    ],
    providers: [
      mockAuth(),
      mockWebSocket([
        mockCall('disk.query', []),
      ]),
      mockProvider(ResourcesUsageStore, {}),
    ],
  });

  beforeEach(() => {
    spectator = createHost('<ix-widget-pool></ix-widget-pool>', {
      props: {
        poolState: {} as Pool,
        volumeData: {} as VolumeData,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('checks widget title', () => {
    expect(spectator.query('.card-title-text')).toHaveText('Pool');
  });

  it('checks back button', async () => {
    jest.spyOn(spectator.component, 'goBack');

    const backButton = await loader.getHarness(IxIconHarness.with({ name: 'chevron_left' }));
    await backButton.click();

    expect(spectator.component.goBack).toHaveBeenCalled();
  });

  // TODO: Add more tests
});
