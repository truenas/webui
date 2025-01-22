import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { LicenseFeature } from 'app/enums/license-feature.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { SystemInfo, SystemLicense } from 'app/interfaces/system-info.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  IxSlideToggleComponent,
} from 'app/modules/forms/ix-forms/components/ix-slide-toggle/ix-slide-toggle.component';
import { IxSlideToggleHarness } from 'app/modules/forms/ix-forms/components/ix-slide-toggle/ix-slide-toggle.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  SetProductionStatusDialogComponent,
  SetProductionStatusDialogResult,
} from 'app/pages/system/general-settings/support/set-production-status-dialog/set-production-status-dialog.component';
import { SupportCardComponent } from 'app/pages/system/general-settings/support/support-card/support-card.component';
import { SysInfoComponent } from 'app/pages/system/general-settings/support/sys-info/sys-info.component';
import { selectSystemInfo } from 'app/store/system-info/system-info.selectors';

const systemInfo = {
  system_product: 'N7',
  datetime: { $date: 1666376171107 },
} as SystemInfo;

describe('SupportCardComponent', () => {
  let spectator: Spectator<SupportCardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: SupportCardComponent,
    imports: [
      ReactiveFormsModule,
      IxSlideToggleComponent,
    ],
    providers: [
      mockAuth(),
      mockProvider(MatDialog),
      mockProvider(DialogService),
      mockProvider(MatSnackBar),
      mockApi([
        mockCall('truenas.is_production', true),
        mockJob('truenas.set_production', fakeSuccessfulJob()),
        mockCall('system.product_type', ProductType.CommunityEdition),
      ]),
      provideMockStore({
        selectors: [
          {
            selector: selectSystemInfo,
            value: systemInfo,
          },
        ],
      }),
    ],
    declarations: [
      MockComponent(SysInfoComponent),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  describe('System with a license', () => {
    beforeEach(() => {
      const store$ = spectator.inject(MockStore);
      store$.overrideSelector(selectSystemInfo, {
        ...systemInfo,
        license: {
          features: [LicenseFeature.Jails],
          contract_end: {
            $value: '2027-09-29',
          },
          addhw_detail: [],
        } as SystemLicense,
      });
      store$.refreshState();
    });

    describe('"This is a production system toggle"', () => {
      let isProductionSystemToggle: IxSlideToggleHarness;
      beforeEach(async () => {
        isProductionSystemToggle = await loader.getHarness(IxSlideToggleHarness.with({
          label: 'This is a production system',
        }));
      });

      it('shows current production status of the system', async () => {
        expect(await isProductionSystemToggle.getValue()).toBe(true);
      });

      it('shows SetProductionStatusDialog and sets production status when toggle is set', async () => {
        const matDialog = spectator.inject(MatDialog);
        jest.spyOn(matDialog, 'open').mockReturnValue({
          afterClosed: () => of({ sendInitialDebug: true }),
        } as MatDialogRef<SetProductionStatusDialogComponent, SetProductionStatusDialogResult>);

        await isProductionSystemToggle.setValue(false);
        await isProductionSystemToggle.setValue(true);

        expect(matDialog.open).toHaveBeenCalledWith(SetProductionStatusDialogComponent);
        expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('truenas.set_production', [true, true]);
      });

      it('sets production status to false when toggle is unset', async () => {
        await isProductionSystemToggle.setValue(false);

        expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('truenas.set_production', [false, false]);
      });
    });
  });
});
