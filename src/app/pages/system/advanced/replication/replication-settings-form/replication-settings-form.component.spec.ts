import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnInputHarness } from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { ReplicationSettingsFormComponent } from 'app/pages/system/advanced/replication/replication-settings-form/replication-settings-form.component';

describe('ReplicationSettingsFormComponent', () => {
  let spectator: Spectator<ReplicationSettingsFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  const createComponent = createComponentFactory({
    component: ReplicationSettingsFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('replication.config.config', { max_parallel_replication_tasks: 1 }),
        mockCall('replication.config.update'),
      ]),
      mockProvider(SlideInRef, {
        close: jest.fn(),
        requireConfirmationWhen: jest.fn(),
      }),
      mockProvider(DialogService),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  it('shows current system advanced replication values when form is being edited', async () => {
    expect(await (await getInput('max_parallel_replication_tasks')).getValue()).toBe('1');
  });

  it('sends an update payload to websocket and closes modal when save is pressed', async () => {
    await (await getInput('max_parallel_replication_tasks')).setValue('0');

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();

    expect(api.call).toHaveBeenCalledWith('replication.config.update', [
      {
        max_parallel_replication_tasks: null,
      },
    ]);
  });
});
