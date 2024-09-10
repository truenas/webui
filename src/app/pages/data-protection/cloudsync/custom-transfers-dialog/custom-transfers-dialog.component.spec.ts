import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { CustomTransfersDialogComponent } from 'app/pages/data-protection/cloudsync/custom-transfers-dialog/custom-transfers-dialog.component';

describe('CustomTransfersDialogComponent', () => {
  let spectator: Spectator<CustomTransfersDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: CustomTransfersDialogComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(MatDialogRef),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('selects transfers when save is pressed', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({ Transfers: 10 });

    const save = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await save.click();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(10);
  });
});
