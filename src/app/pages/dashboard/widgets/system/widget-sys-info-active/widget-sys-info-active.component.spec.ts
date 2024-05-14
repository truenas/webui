import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatListModule } from '@angular/material/list';
import { MatListItemHarness } from '@angular/material/list/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponent } from 'ng-mocks';
import { ImgFallbackModule } from 'ngx-img-fallback';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Codename } from 'app/enums/codename.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { SystemLicense, SystemInfo } from 'app/interfaces/system-info.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { selectUpdateJobForActiveNode } from 'app/modules/jobs/store/job.selectors';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { ProductImageComponent } from 'app/pages/dashboard/widgets/system/common/product-image/product-image.component';
import { WidgetSysInfoActiveComponent } from 'app/pages/dashboard/widgets/system/widget-sys-info-active/widget-sys-info-active.component';
import { selectIsHaLicensed, selectIsHaEnabled } from 'app/store/ha-info/ha-info.selectors';
import {
  selectIsIxHardware, selectProductType,
  selectIsEnterprise,
  selectEnclosureSupport,
} from 'app/store/system-info/system-info.selectors';

describe('WidgetSysInfoActiveComponent', () => {
  let spectator: Spectator<WidgetSysInfoActiveComponent>;
  let loader: HarnessLoader;

  const systemInfo = {
    platform: 'TRUENAS-TEST-HA',
    version: 'TrueNAS-SCALE-24.10.0-MASTER-20240301-233006',
    codename: Codename.ElectricEel,
    license: {
      contract_type: 'BEST',
      contract_end: {
        $type: 'date',
        $value: '2025-01-01',
      },
    } as SystemLicense,
    system_serial: 'AA-00001',
    system_product: 'Generic',
    hostname: 'test-hostname-a',
    uptime_seconds: 83532.938532175,
    datetime: {
      $date: 1710491651000,
    },
  } as SystemInfo;

  const createComponent = createComponentFactory({
    component: WidgetSysInfoActiveComponent,
    imports: [
      MatListModule,
      ImgFallbackModule,
    ],
    declarations: [
      MockComponent(ProductImageComponent),
      MockComponent(IxIconComponent),
      MockComponent(NgxSkeletonLoaderComponent),
      FakeFormatDateTimePipe,
    ],
    providers: [
      mockAuth(),
      mockProvider(WidgetResourcesService, {
        systemInfo$: of(systemInfo),
        updateAvailable$: of(true),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectProductType,
            value: ProductType.ScaleEnterprise,
          },
          {
            selector: selectIsEnterprise,
            value: true,
          },
          {
            selector: selectEnclosureSupport,
            value: true,
          },
          {
            selector: selectIsIxHardware,
            value: true,
          },
          {
            selector: selectIsHaLicensed,
            value: true,
          },
          {
            selector: selectIsHaEnabled,
            value: true,
          },
          {
            selector: selectUpdateJobForActiveNode,
            value: null,
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        size: SlotSize.Full,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('checks title', () => {
    expect(spectator.query('.header h3')).toHaveText('System Information');
  });

  it('checks system info rows', async () => {
    const matListItems = await loader.getAllHarnesses(MatListItemHarness);
    const items = await parallel(() => matListItems.map((item) => item.getFullText()));
    expect(items).toEqual([
      'Platform:TRUENAS-TEST-HA',
      'Version:ElectricEel-24.10.0-MASTER-20240301-233006',
      'License:Best contract, expires 2025-01-01',
      'System Serial:AA-00001',
      'Hostname:test-hostname-a',
      'Uptime:23 hours 12 minutes as of 2024-03-15 10:34:11',
    ]);
  });

  // TODO: Add more tests
});
