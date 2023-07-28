import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IscsiAuthAccess } from 'app/interfaces/iscsi.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import {
  AuthorizedAccessFormComponent,
} from 'app/pages/sharing/iscsi/authorized-access/authorized-access-form/authorized-access-form.component';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

describe('AuthorizedAccessFormComponent', () => {
  let spectator: Spectator<AuthorizedAccessFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const existingAuthorizedAccess = {
    id: 123,
    tag: 23,
    user: 'user',
    peeruser: 'peer',
    secret: '123456789012',
    peersecret: 'peer123456789012',
  } as IscsiAuthAccess;

  const createComponent = createComponentFactory({
    component: AuthorizedAccessFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(IxSlideInService),
      mockProvider(DialogService),
      mockWebsocket([
        mockCall('iscsi.auth.create'),
        mockCall('iscsi.auth.update'),
      ]),
      mockProvider(IxSlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
    ],
  });

  describe('create authorized access', () => {
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('add new authorized access when form is submitted', async () => {
      await form.fillForm({
        'Group ID': '113',
        User: 'new-user',
        Secret: '123456789012',
        'Secret (Confirm)': '123456789012',
        'Peer User': 'new-peer',
        'Peer Secret': 'peer123456789012',
        'Peer Secret (Confirm)': 'peer123456789012',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('iscsi.auth.create', [{
        tag: 113,
        user: 'new-user',
        secret: '123456789012',
        peeruser: 'new-peer',
        peersecret: 'peer123456789012',
      }]);
      expect(spectator.inject(IxSlideInRef).close).toHaveBeenCalled();
    });
  });

  describe('edit existing authorized access', () => {
    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          { provide: SLIDE_IN_DATA, useValue: existingAuthorizedAccess },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('shows values for an existing authorized access when form is opened for edit', async () => {
      const values = await form.getValues();
      expect(values).toEqual({
        'Group ID': '23',
        User: 'user',
        Secret: '123456789012',
        'Secret (Confirm)': '',
        'Peer User': 'peer',
        'Peer Secret': 'peer123456789012',
        'Peer Secret (Confirm)': '',
      });
    });

    it('edits existing authorized access when form opened for edit is submitted', async () => {
      await form.fillForm({
        'Group ID': '120',
        User: 'updated-user',
        Secret: '123456789012',
        'Secret (Confirm)': '123456789012',
        'Peer User': '',
        'Peer Secret': '',
        'Peer Secret (Confirm)': '',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith(
        'iscsi.auth.update',
        [
          123,
          {
            tag: 120,
            user: 'updated-user',
            secret: '123456789012',
            peeruser: '',
            peersecret: '',
          },
        ],
      );
      expect(spectator.inject(IxSlideInRef).close).toHaveBeenCalled();
    });
  });
});
