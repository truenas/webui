import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness } from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ReplicationConfig } from 'app/interfaces/replication-config.interface';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { ReplicationSettingsFormComponent } from 'app/pages/system/advanced/replication/replication-settings-form/replication-settings-form.component';

describe('ReplicationSettingsFormComponent', () => {
  let spectator: Spectator<ReplicationSettingsFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const createComponent = createComponentFactory({
    component: ReplicationSettingsFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      ...ixFormTestingProviders(),
      mockApi([
        mockCall('replication.config.update'),
      ]),
      mockProvider(SlideInRef, {
        close: jest.fn(),
        getData: jest.fn(() => ({ max_parallel_replication_tasks: 1 } as ReplicationConfig)),
        requireConfirmationWhen: jest.fn(),
      }),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  it('shows current system advanced replication values when form is being edited', async () => {
    const input = await loader.getHarness(TnInputHarness.with({ name: 'max_parallel_replication_tasks' }));

    expect(await input.getValue()).toBe('1');
  });

  it('sends an update payload to websocket and closes modal when save is pressed', async () => {
    const input = await loader.getHarness(TnInputHarness.with({ name: 'max_parallel_replication_tasks' }));
    await input.setValue('0');

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(api.call).toHaveBeenCalledWith('replication.config.update', [
      {
        max_parallel_replication_tasks: null,
      },
    ]);
  });
});
