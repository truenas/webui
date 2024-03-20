import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatGridListModule } from '@angular/material/grid-list';
import { Spectator } from '@ngneat/spectator';
import { createHostFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { DragHandleComponent } from 'app/core/components/drag-handle/drag-handle.component';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { WidgetStorageComponent } from 'app/pages/dashboard/components/widget-storage/widget-storage.component';
import { DashboardStorageStore } from 'app/pages/dashboard/store/dashboard-storage-store.service';

describe('WidgetStorageComponent', () => {
  let spectator: Spectator<WidgetStorageComponent>;
  let loader: HarnessLoader;

  const createHost = createHostFactory({
    component: WidgetStorageComponent,
    imports: [
      NgxSkeletonLoaderModule,
      MatGridListModule,
    ],
    declarations: [
      MockComponent(DragHandleComponent),
      MockComponent(EmptyComponent),
    ],
    providers: [
      mockAuth(),
      mockProvider(DashboardStorageStore, {
        isLoading$: of(false),
        pools$: of([]),
        volumesData$: of([]),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createHost('<ix-widget-storage></ix-widget-storage>');
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('checks widget title', () => {
    expect(spectator.query('.card-title-text')).toHaveText('Storage');
  });

  it('checks back button', async () => {
    jest.spyOn(spectator.component, 'goBack');

    const backButton = await loader.getHarness(IxIconHarness.with({ name: 'chevron_left' }));
    await backButton.click();

    expect(spectator.component.goBack).toHaveBeenCalled();
  });

  // TODO: Add more tests
});
