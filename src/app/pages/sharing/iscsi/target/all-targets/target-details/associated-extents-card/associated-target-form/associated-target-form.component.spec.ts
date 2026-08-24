import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnButtonHarness, TnDialogHarness, TnInputHarness, TnSelectHarness,
} from '@truenas/ui-components';
import { provideTnFormFieldErrors } from 'app/core/providers/tn-form-field-errors.provider';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IscsiTargetExtent } from 'app/interfaces/iscsi.interface';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { AssociatedTargetFormComponent } from './associated-target-form.component';

describe('AssociatedTargetFormComponent', () => {
  let spectator: Spectator<AssociatedTargetFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const dialogData = {
    target: { id: 1, name: 'Target 1' },
    extents: [{ id: 1, name: 'Extent 1' }, { id: 2, name: 'Extent 2' }],
  };

  const createComponent = createComponentFactory({
    component: AssociatedTargetFormComponent,
    imports: [ReactiveFormsModule],
    providers: [
      mockAuth(),
      ...ixFormTestingProviders(),
      provideTnFormFieldErrors(),
      mockApi([
        mockCall('iscsi.targetextent.create', { id: 7 } as IscsiTargetExtent),
      ]),
      mockProvider(DialogRef),
      {
        provide: DIALOG_DATA,
        useValue: dialogData,
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  it('shows the dialog title with target name', async () => {
    const dialog = await loader.getHarness(TnDialogHarness);
    expect(await dialog.getTitle()).toBe('Associate Target 1');
  });

  it('submits form with correct values and closes the dialog with the created association', async () => {
    const dialogRef = spectator.inject(DialogRef);
    const spyClose = jest.spyOn(dialogRef, 'close');

    const lunIdInput = await loader.getHarness(TnInputHarness);
    await lunIdInput.setValue('0');

    const extentSelect = await loader.getHarness(TnSelectHarness);
    await extentSelect.selectOption(/Extent 1/);

    const associateButton = await loader.getHarness(TnButtonHarness.with({ label: 'Associate' }));
    await associateButton.click();

    expect(api.call).toHaveBeenCalledWith('iscsi.targetextent.create', [
      { lunid: 0, extent: 1, target: 1 },
    ]);
    expect(spyClose).toHaveBeenCalledWith({ id: 7 });
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Extent associated with target');
  });

  it('keeps Associate disabled until the required Extent is picked', async () => {
    const associateButton = await loader.getHarness(TnButtonHarness.with({ label: 'Associate' }));
    expect(await associateButton.isDisabled()).toBe(true);

    await (await loader.getHarness(TnSelectHarness)).selectOption(/Extent 1/);

    expect(await associateButton.isDisabled()).toBe(false);
  });

  it('closes dialog on cancel', async () => {
    const dialogRef = spectator.inject(DialogRef);
    const spyClose = jest.spyOn(dialogRef, 'close');

    const cancelButton = await loader.getHarness(TnButtonHarness.with({ label: 'Cancel' }));
    await cancelButton.click();

    expect(spyClose).toHaveBeenCalledWith(false);
  });
});
