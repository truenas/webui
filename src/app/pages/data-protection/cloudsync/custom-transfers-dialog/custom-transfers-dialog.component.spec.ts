import { DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness } from '@truenas/ui-components';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { CustomTransfersDialog } from 'app/pages/data-protection/cloudsync/custom-transfers-dialog/custom-transfers-dialog.component';

describe('CustomTransfersDialogComponent', () => {
  let spectator: Spectator<CustomTransfersDialog>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: CustomTransfersDialog,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(DialogRef),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('selects transfers when save is pressed', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({ Transfers: 10 });

    const save = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await save.click();

    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith(10);
  });
});
