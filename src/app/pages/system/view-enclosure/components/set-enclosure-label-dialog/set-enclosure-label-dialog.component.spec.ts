import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IxCheckboxHarness } from 'app/modules/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxInputHarness } from 'app/modules/ix-forms/components/ix-input/ix-input.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import {
  SetEnclosureLabelDialogComponent, SetEnclosureLabelDialogData,
} from 'app/pages/system/view-enclosure/components/set-enclosure-label-dialog/set-enclosure-label-dialog.component';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';

describe('SetEnclosureLabelDialogComponent', () => {
  let spectator: Spectator<SetEnclosureLabelDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: SetEnclosureLabelDialogComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('enclosure.update'),
      ]),
      mockProvider(DialogService),
      mockProvider(MatDialogRef),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          enclosureId: '1234',
          currentLabel: 'My TRUENAS-M40-HA',
          defaultLabel: 'TRUENAS-M40-HA',
        } as SetEnclosureLabelDialogData,
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('saves new label it is entered and dialog is submitted', async () => {
    const labelInput = await loader.getHarness(IxInputHarness.with({ label: 'Enclosure Label' }));
    await labelInput.setValue('New label');

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('enclosure.update', ['1234', { label: 'New label' }]);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith('New label');
  });

  it('resets enclosure label to a default when Reset checkbox is ticked and form is saved', async () => {
    const resetCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Reset to default' }));
    await resetCheckbox.setValue(true);

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('enclosure.update', ['1234', { label: 'TRUENAS-M40-HA' }]);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith('TRUENAS-M40-HA');
  });
});
