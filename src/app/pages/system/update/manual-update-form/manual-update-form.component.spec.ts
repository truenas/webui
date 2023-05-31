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
import { DsUncachedUser } from 'app/interfaces/ds-cache.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { Preferences } from 'app/interfaces/preferences.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { ManualUpdateFormComponent } from 'app/pages/system/update/manual-update-form/manual-update-form.component';
import { DialogService, SystemGeneralService } from 'app/services';
import { WebsocketConnectionService } from 'app/services/websocket-connection.service';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

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

  it('checks component existance', () => {
    expect(spectator).toExist();
    expect(loader).toExist();
  });

  /**
   * TODO: More tests should be written to test form submission etc once
   * harness and test files are ready for IxFileInputComponent
   */
});
