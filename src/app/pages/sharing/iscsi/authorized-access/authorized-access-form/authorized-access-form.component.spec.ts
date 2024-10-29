import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IscsiAuthAccess } from 'app/interfaces/iscsi.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import {
  AuthorizedAccessFormComponent,
} from 'app/pages/sharing/iscsi/authorized-access/authorized-access-form/authorized-access-form.component';
import { SlideInService } from 'app/services/slide-in.service';
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
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockProvider(SlideInService),
      mockProvider(DialogService),
      mockWebSocket([
        mockCall('iscsi.auth.create'),
        mockCall('iscsi.auth.update'),
      ]),
      mockProvider(SlideInRef),
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
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
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
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });
  });
});
