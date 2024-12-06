import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatCardModule } from '@angular/material/card';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { FibreChannelPort } from 'app/interfaces/fibre-channel.interface';
import { IscsiTarget } from 'app/interfaces/iscsi.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { FibreChannelPortsFormComponent } from 'app/pages/sharing/iscsi/fibre-channel-ports-form/fibre-channel-ports-form.component';
import { ApiService } from 'app/services/websocket/api.service';

describe('FibreChannelPortsFormComponent', () => {
  let spectator: Spectator<FibreChannelPortsFormComponent>;
  let loader: HarnessLoader;
  const mockFibreChannel = {
    id: 1,
    port: 'fc0',
    target: {
      id: 1,
    },
  } as FibreChannelPort;

  const createComponent = createComponentFactory({
    component: FibreChannelPortsFormComponent,
    imports: [
      ReactiveFormsModule,
      IxSelectComponent,
      IxInputComponent,
      IxFieldsetComponent,
      FormActionsComponent,
      MatButtonModule,
      MatCardModule,
    ],
    providers: [
      mockAuth(),
      mockProvider(SnackbarService),
      mockApi([
        mockCall('fcport.create'),
        mockCall('fcport.update'),
        mockCall('iscsi.target.query', [{ id: 1, name: 'target1' }, { id: 2, name: 'target2' }] as IscsiTarget[]),
      ]),
      mockProvider(SlideInRef),
      { provide: SLIDE_IN_DATA, useValue: null },
    ],
  });

  describe('creating new fibre channel port', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          { provide: SLIDE_IN_DATA, useValue: null },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows correct title when creating new fibre channel port', () => {
      const title = spectator.query('ix-modal-header');
      expect(title).toHaveText('Add Fibre Channel Port');
    });

    it('shows form values when creating new fibre channel port', async () => {
      const form = await loader.getHarness(IxFormHarness);

      expect(await form.getValues()).toEqual({
        Port: '',
        Target: '',
      });
    });

    it('creates new fibre channel port when form is submitted', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Port: 'fc0',
        Target: 'target1',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('fcport.create', [{
        port: 'fc0',
        target_id: 1,
      }]);
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });
  });

  describe('editing existing fibre channel port', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          { provide: SLIDE_IN_DATA, useValue: mockFibreChannel },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows form values when editing existing fibre channel port', async () => {
      const form = await loader.getHarness(IxFormHarness);

      expect(await form.getValues()).toEqual({
        Port: 'fc0',
        Target: 'target1',
      });
    });

    it('shows correct title when editing existing fibre channel port', () => {
      const title = spectator.query('ix-modal-header');
      expect(title).toHaveText('Edit Fibre Channel Port');
    });

    it('saves updated fibre channel port when form is submitted', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Port: 'fc0',
        Target: 'target2',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('fcport.update', [1, {
        port: 'fc0',
        target_id: 2,
      }]);
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });

    it('loads and shows target options in select', async () => {
      const select = await loader.getHarness(IxSelectHarness.with({ label: 'Target' }));
      const options = await select.getOptionLabels();

      expect(options).toEqual(['target1', 'target2', 'Create New']);
    });
  });
});
