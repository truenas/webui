import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  createComponentFactory, mockProvider, Spectator, SpectatorFactory,
} from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { TrueCommandStatus } from 'app/enums/true-command-status.enum';
import { TrueCommandConfig } from 'app/interfaces/true-command-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { TruecommandConnectModalComponent, TruecommandSignupModalState } from 'app/modules/truecommand/components/truecommand-connect-modal/truecommand-connect-modal.component';
import { ApiService } from 'app/modules/websocket/api.service';

function getFakeConfig(overrides: Partial<TrueCommandConfig>): TrueCommandConfig {
  return {
    api_key: null,
    status: TrueCommandStatus.Disabled,
    enabled: false,
    id: 999,
    remote_ip_address: 'remote_ip_address string',
    remote_url: 'remote_url string',
    status_reason: 'status_reason string',
    ...overrides,
  };
}

describe('TruecommandConnectModalComponent', () => {
  let spectator: Spectator<TruecommandConnectModalComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  function createComponentWithData(
    config: Partial<TrueCommandConfig>,
    isConnected: boolean,
  ): SpectatorFactory<TruecommandConnectModalComponent> {
    return createComponentFactory({
      component: TruecommandConnectModalComponent,
      imports: [
        ReactiveFormsModule,
      ],
      providers: [
        mockApi([
          mockCall('truecommand.update'),
        ]),
        mockProvider(AppLoaderService),
        mockProvider(DialogService),
        mockProvider(MatDialogRef),
        mockAuth(),
      ],
      componentProviders: [
        {
          provide: MAT_DIALOG_DATA,
          useFactory: () => ({
            isConnected,
            config: getFakeConfig(config),
          } as TruecommandSignupModalState),
        },
      ],
    });
  }

  [
    {
      fakeConfig: {
        api_key: '',
        enabled: false,
      },
      isConnected: false,
      expectedTitle: 'Connect to TrueCommand Cloud',
      expectedFormValue: {
        'API Key': '',
        Enable: true,
      },
      expectedSubmitButtonText: 'Connect',
    },
    {
      fakeConfig: {
        api_key: '1234567890123456',
        enabled: true,
      },
      isConnected: true,
      expectedTitle: 'Update TrueCommand Settings',
      expectedFormValue: {
        'API Key': '1234567890123456',
        Enable: true,
      },
      expectedSubmitButtonText: 'Save',
    },
  ].forEach(({
    fakeConfig, isConnected, expectedFormValue, expectedTitle, expectedSubmitButtonText,
  }) => {
    describe(`when api_key = '${fakeConfig.api_key}'`, () => {
      const createComponent = createComponentWithData(fakeConfig, isConnected);

      beforeEach(() => {
        spectator = createComponent();
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        api = spectator.inject(ApiService);
      });

      it(`it has title '${expectedTitle}'`, () => {
        expect(spectator.query('.truecommand-connect-modal-form-title'))
          .toContainText(expectedTitle);
      });

      it('shows current settings for Truecommand when form is opened', async () => {
        const form = await loader.getHarness(IxFormHarness);
        const values = await form.getValues();

        expect(values).toEqual(expectedFormValue);
      });

      it(`submit button has text ${expectedSubmitButtonText}`, async () => {
        const button = await loader.getHarness(MatButtonHarness.with({ text: expectedSubmitButtonText }));
        expect(button).toBeTruthy();
      });
    });
  });

  const caseWhenConnectClicked = {
    fakeConfig: {
      api_key: '',
      enabled: false,
    },
    isConnected: false,
    expectedSubmitButtonText: 'Connect',
  };
  describe(`when '${caseWhenConnectClicked.expectedSubmitButtonText}' is clicked`, () => {
    const {
      fakeConfig,
      isConnected,
      expectedSubmitButtonText,
    } = caseWhenConnectClicked;
    const createComponent = createComponentWithData(fakeConfig, isConnected);

    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('sends an update payload', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        'API Key': '1234567890123456',
        Enable: true,
      });

      const submitButton = await loader.getHarness(MatButtonHarness.with({ text: expectedSubmitButtonText }));
      expect(await submitButton.isDisabled()).toBeFalsy();
      await submitButton.click();

      expect(api.call).toHaveBeenCalledWith('truecommand.update', [{
        api_key: '1234567890123456',
        enabled: true,
      }]);
    });
  });

  const caseWhenSaveClicked = {
    fakeConfig: {
      api_key: '1234567890123456',
      enabled: true,
    },
    isConnected: true,
    expectedSubmitButtonText: 'Save',
  };
  describe(`when '${caseWhenSaveClicked.expectedSubmitButtonText}' is clicked`, () => {
    const {
      fakeConfig,
      isConnected,
      expectedSubmitButtonText,
    } = caseWhenSaveClicked;
    const createComponent = createComponentWithData(fakeConfig, isConnected);

    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('sends an update payload', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        'API Key': 'qwertyuiopasdfgh',
        Enable: false,
      });

      const submitButton = await loader.getHarness(MatButtonHarness.with({ text: expectedSubmitButtonText }));
      expect(await submitButton.isDisabled()).toBeFalsy();
      await submitButton.click();

      expect(api.call).toHaveBeenCalledWith('truecommand.update', [{
        api_key: 'qwertyuiopasdfgh',
        enabled: false,
      }]);
    });
  });

  const caseWhenDeregisterClicked = {
    fakeConfig: {
      api_key: '1234567890123456',
      enabled: true,
    },
    isConnected: true,
    expectedSubmitButtonText: 'Deregister',
  };
  describe(`when '${caseWhenDeregisterClicked.expectedSubmitButtonText}' is clicked`, () => {
    let dialogServiceMock: DialogService;

    const {
      fakeConfig,
      isConnected,
      expectedSubmitButtonText,
    } = caseWhenDeregisterClicked;
    const createComponent = createComponentWithData(fakeConfig, isConnected);

    beforeEach(() => {
      spectator = createComponent();

      dialogServiceMock = spectator.inject(DialogService);
      jest.spyOn(dialogServiceMock, 'generalDialog').mockReturnValue(of(true));

      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('sends an update payload', async () => {
      const deregisterButton = await loader.getHarness(MatButtonHarness.with({ text: expectedSubmitButtonText }));
      expect(await deregisterButton.isDisabled()).toBeFalsy();
      await deregisterButton.click();

      expect(api.call).toHaveBeenCalledWith('truecommand.update', [{
        api_key: null,
        enabled: false,
      }]);
    });
  });
});
