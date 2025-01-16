import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IscsiAuthAccess } from 'app/interfaces/iscsi.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  AuthorizedAccessFormComponent,
} from 'app/pages/sharing/iscsi/authorized-access/authorized-access-form/authorized-access-form.component';

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

  const slideInRef: SlideInRef<IscsiAuthAccess | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn(() => undefined),
  };

  const createComponent = createComponentFactory({
    component: AuthorizedAccessFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockProvider(SlideIn, {
        components$: of([]),
      }),
      mockProvider(DialogService),
      mockApi([
        mockCall('iscsi.auth.create'),
        mockCall('iscsi.auth.update'),
      ]),
      mockProvider(SlideInRef, slideInRef),
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

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('iscsi.auth.create', [{
        tag: 113,
        user: 'new-user',
        secret: '123456789012',
        peeruser: 'new-peer',
        peersecret: 'peer123456789012',
        discovery_auth: 'NONE',
      }]);
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });
  });

  describe('edit existing authorized access', () => {
    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: () => existingAuthorizedAccess }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('shows values for an existing authorized access when form is opened for edit', async () => {
      const values = await form.getValues();
      expect(values).toEqual({
        'Group ID': '23',
        'Discovery Authentication': 'NONE',
        User: 'user',
        Secret: '123456789012',
        'Secret (Confirm)': '123456789012',
        'Peer User': 'peer',
        'Peer Secret': 'peer123456789012',
        'Peer Secret (Confirm)': 'peer123456789012',
      });
    });

    it('edits existing authorized access when form opened for edit is submitted', async () => {
      await form.fillForm({
        'Group ID': '120',
        'Discovery Authentication': 'NONE',
        User: 'updated-user',
        Secret: '123456789012',
        'Secret (Confirm)': '123456789012',
        'Peer User': '',
        'Peer Secret': '',
        'Peer Secret (Confirm)': '',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
        'iscsi.auth.update',
        [
          123,
          {
            tag: 120,
            user: 'updated-user',
            secret: '123456789012',
            peeruser: '',
            peersecret: '',
            discovery_auth: 'NONE',
          },
        ],
      );
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });
  });
});
