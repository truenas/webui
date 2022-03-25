import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IscsiAuthMethod } from 'app/enums/iscsi.enum';
import { IscsiTarget } from 'app/interfaces/iscsi.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { TargetFormComponent } from 'app/pages/sharing/iscsi/target/target-form/target-form.component';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('TargetFormComponent', () => {
  let spectator: Spectator<TargetFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const existingTarget = {
    id: 123,
    name: 'name_test',
    alias: 'alias_test',
    mode: 'ISCSI',
    groups: [{
      portal: 11,
      initiator: 12,
      authmethod: IscsiAuthMethod.ChapMutual,
      auth: 13,
    },
    {
      portal: 21,
      initiator: 22,
      authmethod: IscsiAuthMethod.ChapMutual,
      auth: 23,
    }],
  } as IscsiTarget;

  const createComponent = createComponentFactory({
    component: TargetFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(IxSlideInService),
      mockWebsocket([
        mockCall('iscsi.target.create'),
        mockCall('iscsi.target.update'),
        mockCall('iscsi.portal.query'),
        mockCall('iscsi.initiator.query'),
        mockCall('iscsi.auth.query'),
      ]),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('add new target when form is submitted', async () => {
    await form.fillForm({
      'Target Name': 'name_new',
      'Target Alias': 'alias_new',
      'Target Mode': 'iSCSI',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('iscsi.target.create', [{
      name: 'name_new',
      alias: 'alias_new',
      mode: 'ISCSI',
      groups: [],
    }]);
    expect(spectator.inject(IxSlideInService).close).toHaveBeenCalled();
  });

  it('shows values for an existing target when form is opened for edit', async () => {
    spectator.component.setTargetForEdit(existingTarget);

    const values = await form.getValues();
    expect(values).toEqual({
      'Target Name': 'name_test',
      'Target Alias': 'alias_test',
      'Target Mode': 'iSCSI',
      'Authentication Group Number': '',
      'Authentication Method': 'Mutual CHAP',
      'Initiator Group ID': '',
      'Portal Group ID': '',
    });
  });

  it('edits existing target when form opened for edit is submitted', async () => {
    spectator.component.setTargetForEdit(existingTarget);

    await form.fillForm({
      'Target Name': 'name_new',
      'Target Alias': 'alias_new',
      'Target Mode': 'iSCSI',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenLastCalledWith(
      'iscsi.target.update',
      [
        123,
        {
          name: 'name_new',
          alias: 'alias_new',
          mode: 'ISCSI',
          groups: [
            {
              portal: 11,
              initiator: 12,
              authmethod: IscsiAuthMethod.ChapMutual,
              auth: 13,
            },
            {
              portal: 21,
              initiator: 22,
              authmethod: IscsiAuthMethod.ChapMutual,
              auth: 23,
            },
          ],
        },
      ],
    );
    expect(spectator.inject(IxSlideInService).close).toHaveBeenCalled();
  });
});
