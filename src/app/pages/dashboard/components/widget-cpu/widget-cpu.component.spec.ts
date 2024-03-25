import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createHostFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponent } from 'ng-mocks';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { DragHandleComponent } from 'app/core/components/drag-handle/drag-handle.component';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ProductType } from 'app/enums/product-type.enum';
import { ViewChartGaugeComponent } from 'app/modules/charts/components/view-chart-gauge/view-chart-gauge.component';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { WidgetCpuComponent } from 'app/pages/dashboard/components/widget-cpu/widget-cpu.component';
import { ResourcesUsageStore } from 'app/pages/dashboard/store/resources-usage-store.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { selectTheme } from 'app/store/preferences/preferences.selectors';
import { selectSystemInfo } from 'app/store/system-info/system-info.selectors';

describe('WidgetCpuComponent', () => {
  let spectator: Spectator<WidgetCpuComponent>;
  let loader: HarnessLoader;

  const createHost = createHostFactory({
    component: WidgetCpuComponent,
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
        cpuUsage$: of({
          average: {
            usage: 0.5,
          },
        }),
      }),
      provideMockStore({
        selectors: [{
          selector: selectSystemInfo,
          value: {
            model: 'Intel(R) Xeon(R) Silver 4210R CPU',
            cores: 4,
            physical_cores: 2,
          },
        }, {
          selector: selectTheme,
          value: 'ix-dark',
        }],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createHost('<ix-widget-cpu></ix-widget-cpu>');
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('checks widget title', () => {
    expect(spectator.query('.card-title-text')).toHaveText('CPU');
  });

  it('checks cpu model', () => {
    expect(spectator.query('.cpu-model')).toHaveText('Intel(R) Xeon(R) Silver 4210R CPU');
  });

  it('checks back button', async () => {
    jest.spyOn(spectator.component, 'goBack');

    const backButton = await loader.getHarness(IxIconHarness.with({ name: 'chevron_left' }));
    await backButton.click();

    expect(spectator.component.goBack).toHaveBeenCalled();
  });

  // TODO: Add more tests
});
