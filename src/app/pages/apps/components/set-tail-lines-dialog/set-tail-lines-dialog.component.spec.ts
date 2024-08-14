import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { IxFormsModule } from 'app/modules/forms/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SetTailLinesDialogComponent } from 'app/pages/apps/components/set-tail-lines-dialog/set-tail-lines-dialog.component';

describe('SetTailLinesDialogComponent', () => {
  let loader: HarnessLoader;
  let form: IxFormHarness;
  let spectator: Spectator<SetTailLinesDialogComponent>;
  const createComponent = createComponentFactory({
    component: SetTailLinesDialogComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      mockProvider(MatDialogRef),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('dialog should be closed when Reconnect is pressed', async () => {
    await form.fillForm({ 'Tail Lines': 600 });
    const valueLogsForm = await form.getValues();

    expect(valueLogsForm).toEqual({
      'Tail Lines': '600',
    });

    const connectButton = await loader.getHarness(MatButtonHarness.with({ text: 'Connect' }));
    await connectButton.click();
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(600);
  });
});
