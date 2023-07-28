import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { ProductType } from 'app/enums/product-type.enum';
import { helptextSystemUpdate as helptext } from 'app/helptext/system/update';
import { DsUncachedUser } from 'app/interfaces/ds-cache.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { Preferences } from 'app/interfaces/preferences.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { IxSelectHarness } from 'app/modules/ix-forms/components/ix-select/ix-select.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { ManualUpdateFormComponent } from 'app/pages/system/update/manual-update-form/manual-update-form.component';
import { DialogService } from 'app/services/dialog.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { WebsocketConnectionService } from 'app/services/websocket-connection.service';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { selectSystemInfo } from 'app/store/system-info/system-info.selectors';

describe('ManualUpdateFormComponent', () => {
  let spectator: Spectator<ManualUpdateFormComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: ManualUpdateFormComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('auth.me', {
          attributes: {
            preferences: {
              rebootAfterManualUpdate: false,
            } as Preferences,
          },
        } as DsUncachedUser),
        mockCall('pool.query', [
          {
            name: 'pool2',
          } as Pool,
        ]),
        mockCall('failover.licensed'),
        mockCall('core.get_jobs'),
        mockCall('auth.set_attribute'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(Router),
      mockProvider(SystemGeneralService),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
      mockWindow({
        localStorage: {
          getItem: () => ProductType.ScaleEnterprise,
        },
      }),
      mockProvider(WebsocketConnectionService, {
        isConnected$: of(true),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectPreferences,
            value: {
              rebootAfterManualUpdate: false,
            } as Preferences,
          },
          {
            selector: selectSystemInfo,
            value: {
              version: 'TrueNAS-SCALE-22.12',
            } as SystemInfo,
          },
          {
            selector: selectIsHaLicensed,
            value: false,
          },
        ],
      }),
    ],
  });

  beforeEach(/* async */ () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    // form = await loader.getHarness(IxFormHarness);
    // websocket = spectator.inject(WebSocketService2);
  });

  it('loads all pool location options if is not HA system', async () => {
    const locationSelect = await loader.getHarness(IxSelectHarness.with({ label: helptext.filelocation.placeholder }));
    const optionLabels = await locationSelect.getOptionLabels();
    expect(spectator.component.isHaLicensed).toBe(false);
    expect(optionLabels).toEqual([
      'Memory device',
      '/mnt/pool2',
    ]);
  });

  it('hides filelocation select if is HA system', async () => {
    spectator.component.isHaLicensed = true;
    const select = await loader.getHarnessOrNull(IxSelectHarness.with({ label: helptext.filelocation.placeholder }));

    expect(spectator.component.isHaLicensed).toBe(true);
    expect(select).toBeNull();
  });

  /**
   * TODO: More tests should be written to test form submission etc once
   * harness and test files are ready for IxFileInputComponent
   */
});
