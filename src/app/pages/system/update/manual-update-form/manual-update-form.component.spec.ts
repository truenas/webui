import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { ProductType } from 'app/enums/product-type.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextSystemUpdate as helptext } from 'app/helptext/system/update';
import { Pool } from 'app/interfaces/pool.interface';
import { Preferences } from 'app/interfaces/preferences.interface';
import { User } from 'app/interfaces/user.interface';
import { IxSelectHarness } from 'app/modules/ix-forms/components/ix-select/ix-select.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { ManualUpdateFormComponent } from 'app/pages/system/update/manual-update-form/manual-update-form.component';
import { DialogService, SystemGeneralService } from 'app/services';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

describe('ManualUpdateFormComponent', () => {
  let spectator: Spectator<ManualUpdateFormComponent>;
  let loader: HarnessLoader;
  // let form: IxFormHarness;
  // let websocket: WebSocketService;

  const createComponent = createComponentFactory({
    component: ManualUpdateFormComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('user.query', [{
          attributes: {
            preferences: {
              rebootAfterManualUpdate: false,
            } as unknown as Preferences,
          },
        } as unknown as User]),
        mockCall('pool.query', [
          {
            name: 'pool2',
          } as unknown as Pool,
        ]),
        mockCall('failover.licensed'),
        mockCall('core.get_jobs'),
        mockCall('user.set_attribute'),
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
      {
        provide: WINDOW,
        useValue: {
          localStorage: {
            getItem: () => ProductType.ScaleEnterprise,
          },
        },
      },
      provideMockStore({
        selectors: [
          {
            selector: selectPreferences,
            value: {
              rebootAfterManualUpdate: false,
            } as Preferences,
          },
        ],
      }),
    ],
  });

  beforeEach(/* async */ () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    // form = await loader.getHarness(IxFormHarness);
    // websocket = spectator.inject(WebSocketService);
  });

  it('loads all pool location options', async () => {
    const locationSelect = await loader.getHarness(IxSelectHarness.with({ label: helptext.filelocation.placeholder }));
    const optionLabels = await locationSelect.getOptionLabels();
    expect(optionLabels).toEqual([
      'Memory device',
      '/mnt/pool2',
    ]);
  });

  /**
   * TODO: More tests should be written to test form submission etc once
   * harness and test files are ready for IxFileInputComponent
   */
});
