import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatListItemHarness } from '@angular/material/list/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import {
  SelfEncryptingDriveCardComponent,
} from 'app/pages/system/advanced/self-encrypting-drive/self-encrypting-drive-card/self-encrypting-drive-card.component';
import {
  SelfEncryptingDriveFormComponent,
} from 'app/pages/system/advanced/self-encrypting-drive/self-encrypting-drive-form/self-encrypting-drive-form.component';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { selectAdvancedConfig } from 'app/store/system-config/system-config.selectors';

describe('SelfEncryptingDriveCardComponent', () => {
  let spectator: Spectator<SelfEncryptingDriveCardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: SelfEncryptingDriveCardComponent,
    providers: [
      mockAuth(),
      mockApi([
        mockCall('system.advanced.sed_global_password', '12345678'),
      ]),
      provideMockStore({
        selectors: [
          {
            selector: selectAdvancedConfig,
            value: {
              sed_user: 'admin',
            },
          },
        ],
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => of({ response: true })),
      }),
      mockProvider(FirstTimeWarningService, {
        showFirstTimeWarningIfNeeded: jest.fn(() => of(true)),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows Self Encrypting Drive settings', async () => {
    const items = await loader.getAllHarnesses(MatListItemHarness);
    const itemTexts = await parallel(() => items.map((item) => item.getFullText()));

    expect(itemTexts).toEqual([
      'Password: ********',
    ]);
  });

  it('shows SED form when Configure is pressed', async () => {
    const configureButton = await loader.getHarness(MatButtonHarness.with({ text: 'Configure' }));
    await configureButton.click();

    expect(spectator.inject(FirstTimeWarningService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(
      SelfEncryptingDriveFormComponent,
      {
        data: { sedPassword: '' },
      },
    );
  });
});
