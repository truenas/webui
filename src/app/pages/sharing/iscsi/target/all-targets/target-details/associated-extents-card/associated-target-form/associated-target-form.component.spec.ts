import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ApiService } from 'app/services/websocket/api.service';
import { AssociatedTargetFormComponent } from './associated-target-form.component';

describe('AssociatedTargetFormComponent', () => {
  let spectator: Spectator<AssociatedTargetFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
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
      mockApi([
        mockCall('iscsi.targetextent.create'),
      ]),
      mockProvider(FormErrorHandlerService),
      mockProvider(MatDialogRef),
      {
        provide: MAT_DIALOG_DATA,
        useValue: dialogData,
      },
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
    api = spectator.inject(ApiService);
  });

  it('shows the dialog title with target name', () => {
    const title = spectator.query('h1');
    expect(title).toHaveText('Associate Target 1');
  });

  it('submits form with correct values', async () => {
    await form.fillForm({
      'LUN ID': 0,
      Extent: 'Extent 1',
    });

    const associateButton = await loader.getHarness(MatButtonHarness.with({ text: 'Associate' }));
    await associateButton.click();

    expect(api.call).toHaveBeenCalledWith('iscsi.targetextent.create', [
      { lunid: 0, extent: 1, target: 1 },
    ]);
  });

  it('closes dialog on cancel', async () => {
    const dialogRef = spectator.inject(MatDialogRef);
    const spyClose = jest.spyOn(dialogRef, 'close');

    const cancelButton = await loader.getHarness(MatButtonHarness.with({ text: 'Cancel' }));
    await cancelButton.click();

    expect(spyClose).toHaveBeenCalledWith(false);
  });
});
