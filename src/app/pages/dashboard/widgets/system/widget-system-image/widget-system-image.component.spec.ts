import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { LoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { ProductImageComponent } from 'app/pages/dashboard/widgets/system/common/product-image/product-image.component';
import { WidgetSystemImageComponent } from 'app/pages/dashboard/widgets/system/widget-system-image/widget-system-image.component';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import {
  selectIsIxHardware,
  selectIsEnterprise,
  selectEnclosureSupport,
} from 'app/store/system-info/system-info.selectors';

describe('WidgetSystemImageComponent', () => {
  let spectator: Spectator<WidgetSystemImageComponent>;

  const systemInfo = {
    platform: 'TRUENAS-M40-HA',
  } as SystemInfo;

  const createComponent = createComponentFactory({
    component: WidgetSystemImageComponent,
    declarations: [
      MockComponent(ProductImageComponent),
    ],
    providers: [
      mockAuth(),
      mockProvider(WidgetResourcesService, {
        systemInfo$: of({
          isLoading: false,
          error: null,
          value: systemInfo,
        } as LoadingState<SystemInfo>),
      }),
      provideMockStore({
        selectors: [
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
  });

  it('checks title', () => {
    expect(spectator.query('.header h3')).toHaveText('System Image');
  });

  it('checks ix-product-image render', () => {
    const widget = spectator.query(MockComponent(ProductImageComponent));
    expect(widget).toBeTruthy();
  });
});
