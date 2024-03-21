import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createHostFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import {
  ArcElement, CategoryScale, Chart, DoughnutController,
} from 'chart.js';
import { MockComponent } from 'ng-mocks';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { DragHandleComponent } from 'app/core/components/drag-handle/drag-handle.component';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ProductType } from 'app/enums/product-type.enum';
import { ViewChartGaugeComponent } from 'app/modules/charts/components/view-chart-gauge/view-chart-gauge.component';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { WidgetMemoryComponent } from 'app/pages/dashboard/components/widget-memory/widget-memory.component';
import { ResourcesUsageStore } from 'app/pages/dashboard/store/resources-usage-store.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { selectTheme } from 'app/store/preferences/preferences.selectors';
import { selectSystemInfo } from 'app/store/system-info/system-info.selectors';
import 'jest-canvas-mock';

describe('WidgetMemoryComponent', () => {
  let spectator: Spectator<WidgetMemoryComponent>;
  let loader: HarnessLoader;

  const createHost = createHostFactory({
    component: WidgetMemoryComponent,
    imports: [
      NgxSkeletonLoaderModule,
    ],
    declarations: [
      MockComponent(DragHandleComponent),
      MockComponent(ViewChartGaugeComponent),
    ],
    providers: [
      mockAuth(),
      mockProvider(SystemGeneralService, {
        isEnterprise: () => true,
        getProductType$: of(ProductType.Scale),
      }),
      mockProvider(ResourcesUsageStore, {
        virtualMemoryUsage$: of({
          used: 1,
          total: 10,
          data: [{
            datasets: [{
              data: [],
            }],
          },
          {
            datasets: [{
              data: [],
            }],
          }],
        }),
      }),
      provideMockStore({
        selectors: [{
          selector: selectSystemInfo,
          value: {
            eec_memory: true,
          },
        }, {
          selector: selectTheme,
          value: 'ix-dark',
        }],
      }),
    ],
  });

  beforeAll(() => {
    Chart.register(DoughnutController, ArcElement, CategoryScale);
  });

  beforeEach(() => {
    spectator = createHost('<ix-widget-memory></ix-widget-memory>');
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('checks widget title', () => {
    expect(spectator.query('.card-title-text')).toHaveText('Memory');
  });

  it('checks back button', async () => {
    jest.spyOn(spectator.component, 'goBack');

    const backButton = await loader.getHarness(IxIconHarness.with({ name: 'chevron_left' }));
    await backButton.click();

    expect(spectator.component.goBack).toHaveBeenCalled();
  });

  // TODO: Add more tests
});
