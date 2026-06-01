import { DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness } from '@truenas/ui-components';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { LogsDetailsDialog } from 'app/pages/apps/components/logs-details-dialog/logs-details-dialog.component';

describe('LogsDetailsDialogComponent', () => {
  let loader: HarnessLoader;
  let form: IxFormHarness;
  let spectator: Spectator<LogsDetailsDialog>;
  const createComponent = createComponentFactory({
    component: LogsDetailsDialog,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(DialogRef),
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

    const connectButton = await loader.getHarness(TnButtonHarness.with({ label: 'Connect' }));
    await connectButton.click();
    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith({
      tail_lines: 600,
    });
  });
});
