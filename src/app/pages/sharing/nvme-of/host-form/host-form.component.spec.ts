import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { NvmeOfHost } from 'app/interfaces/nvme-of.interface';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { HostFormComponent } from 'app/pages/sharing/nvme-of/host-form/host-form.component';

describe('HostFormComponent', () => {
  let spectator: Spectator<HostFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const slideInGetData = jest.fn(() => undefined);
  const createComponent = createComponentFactory({
    component: HostFormComponent,
    providers: [
      mockApi([
        mockCall('nvmet.host.create'),
        mockCall('nvmet.host.update'),
        mockCall('nvmet.host.generate_key', '123456'),
      ]),
      mockProvider(SnackbarService),
      mockProvider(SlideInRef, {
        getData: slideInGetData,
        close: jest.fn(),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('creates a new host when form is submitted', async () => {
    await form.fillForm({
      'Host NQN': 'nqn.2014-08.org',
      'Require Host Authentication': true,
      'Key For Host To Present': '1234567890',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.host.create', [{
      hostnqn: 'nqn.2014-08.org',
      dhchap_key: '1234567890',
    }]);
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({
      response: true,
      error: null,
    });
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
  });

  describe('edits', () => {
    beforeEach(() => {
      slideInGetData.mockReturnValue({
        id: 23,
        hostnqn: 'nqn.2014-08.org',
        dhchap_key: '1234567890',
      } as NvmeOfHost);

      spectator.component.ngOnInit();
    });

    it('shows current values when editing an existing host', async () => {
      const formValues = await form.getValues();
      expect(formValues).toEqual({
        'Host NQN': 'nqn.2014-08.org',
        'Require Host Authentication': true,
        'Key For Host To Present': '1234567890',
      });
    });

    it('updates an existing host', async () => {
      await form.fillForm({
        'Host NQN': 'nqn.2014-09.org',
        'Require Host Authentication': false,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.host.update', [23, {
        hostnqn: 'nqn.2014-09.org',
        dhchap_key: null,
      }]);
    });
  });

  describe('other form scenarios', () => {
    it('generates a host key when host authentication is enabled and Generate Key button is pressed', async () => {
      await form.fillForm({
        'Host NQN': 'nqn.2014-08.org',
        'Require Host Authentication': true,
      });

      const generateKeyButton = await loader.getHarness(MatButtonHarness.with({ text: 'Generate Key' }));
      await generateKeyButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.host.generate_key');
      expect(await form.getValues()).toMatchObject({
        'Key For Host To Present': '123456',
      });
    });
  });
});
