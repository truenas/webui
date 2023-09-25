import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockCall, mockJob, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { LicenseFeature } from 'app/enums/license-feature.enum';
import { SystemInfo, SystemLicense } from 'app/interfaces/system-info.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import {
  SetProductionStatusDialogComponent,
  SetProductionStatusDialogResult,
} from 'app/pages/system/general-settings/support/set-production-status-dialog/set-production-status-dialog.component';
import { SupportCardComponent } from 'app/pages/system/general-settings/support/support-card/support-card.component';
import { SysInfoComponent } from 'app/pages/system/general-settings/support/sys-info/sys-info.component';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';
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
      FlexLayoutModule,
      FormsModule,
    ],
    providers: [
      mockProvider(MatDialog),
      mockProvider(DialogService),
      mockProvider(MatSnackBar),
      mockProvider(AppLoaderService),
      mockWebsocket([
        mockCall('truenas.is_production', true),
        mockJob('truenas.set_production'),
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

    describe('"This is a production system checkbox"', () => {
      let isProductionSystemCheckbox: MatCheckboxHarness;
      beforeEach(async () => {
        isProductionSystemCheckbox = await loader.getHarness(MatCheckboxHarness.with({
          label: 'This is a production system',
        }));
      });

      it('shows current production status of the system', async () => {
        expect(await isProductionSystemCheckbox.isChecked()).toBe(true);
      });

      it('shows SetProductionStatusDialog and sets production status when checkbox is ticked', async () => {
        const matDialog = spectator.inject(MatDialog);
        jest.spyOn(matDialog, 'open').mockReturnValue({
          afterClosed: () => of({ sendInitialDebug: true }),
        } as MatDialogRef<SetProductionStatusDialogComponent, SetProductionStatusDialogResult>);

        await isProductionSystemCheckbox.uncheck();
        await isProductionSystemCheckbox.check();

        expect(matDialog.open).toHaveBeenCalledWith(SetProductionStatusDialogComponent);
        expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('truenas.set_production', [true, true]);
      });

      it('sets production status to false when checkbox is unticked', async () => {
        await isProductionSystemCheckbox.uncheck();

        expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('truenas.set_production', [false, false]);
      });
    });
  });
});
