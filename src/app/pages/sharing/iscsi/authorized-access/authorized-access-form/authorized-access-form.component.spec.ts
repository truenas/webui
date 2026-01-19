import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IscsiAuthAccess } from 'app/interfaces/iscsi.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
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
    getData: jest.fn((): undefined => undefined),
  };

  const createComponent = createComponentFactory({
    component: AuthorizedAccessFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockProvider(SlideIn),
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

  describe('mutual CHAP validation', () => {
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('makes peer fields required when Mutual CHAP is selected', async () => {
      await form.fillForm({
        'Group ID': '113',
        User: 'test-user',
        Secret: '123456789012',
        'Secret (Confirm)': '123456789012',
        'Discovery Authentication': 'Mutual CHAP',
      });

      const peerUserControl = await form.getControl('Peer User');
      const peerSecretControl = await form.getControl('Peer Secret');
      const peerSecretConfirmControl = await form.getControl('Peer Secret (Confirm)');

      const peerUserError = await peerUserControl.getErrorText();
      const peerSecretError = await peerSecretControl.getErrorText();
      const peerSecretConfirmError = await peerSecretConfirmControl.getErrorText();

      expect(peerUserError).toBe('Peer User is required');
      expect(peerSecretError).toContain('required');
      expect(peerSecretConfirmError).toBe('Peer Secret (Confirm) is required');

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(true);
    });

    it('allows Mutual CHAP when peer credentials are provided', async () => {
      await form.fillForm({
        'Group ID': '113',
        User: 'test-user',
        Secret: '123456789012',
        'Secret (Confirm)': '123456789012',
        'Peer User': 'peer-user',
        'Peer Secret': 'peer123456789012',
        'Peer Secret (Confirm)': 'peer123456789012',
        'Discovery Authentication': 'Mutual CHAP',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(false);
    });

    it('removes required validator from peer fields when switching from Mutual CHAP to another auth method', async () => {
      await form.fillForm({
        'Discovery Authentication': 'Mutual CHAP',
      });

      // we use `getMatInputHarness` below, but `getControl` returns a generic harness.
      // we're confident that each of these controls is an `ix-input`, though, so
      // we can make this type assertion safely.
      const peerUserControl = await form.getControl('Peer User') as IxInputHarness;
      const peerSecretControl = await form.getControl('Peer Secret') as IxInputHarness;
      const peerSecretConfirmControl = await form.getControl('Peer Secret (Confirm)') as IxInputHarness;

      let peerUserInput = await peerUserControl.getMatInputHarness();
      let peerSecretInput = await peerSecretControl.getMatInputHarness();
      let peerSecretConfirmInput = await peerSecretConfirmControl.getMatInputHarness();

      // each control should have its `required` attribute be present, but that value
      // will just be the empty string. this is okay, because a nonexistent key would have
      // value `null`.
      expect(await (await peerUserInput.host()).getAttribute('required')).not.toBeNull();
      expect(await (await peerSecretInput.host()).getAttribute('required')).not.toBeNull();
      expect(await (await peerSecretConfirmInput.host()).getAttribute('required')).not.toBeNull();

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(true);

      // switch to regular CHAP (not mutual)
      await form.fillForm({
        'Group ID': '113',
        User: 'test-user',
        Secret: '123456789012',
        'Secret (Confirm)': '123456789012',
        'Discovery Authentication': 'CHAP',
      });

      // so we should now expect all the controls to have their required values be `null`.
      peerUserInput = await peerUserControl.getMatInputHarness();
      peerSecretInput = await peerSecretControl.getMatInputHarness();
      peerSecretConfirmInput = await peerSecretConfirmControl.getMatInputHarness();

      expect(await (await peerUserInput.host()).getAttribute('required')).toBeNull();
      expect(await (await peerSecretInput.host()).getAttribute('required')).toBeNull();
      expect(await (await peerSecretConfirmInput.host()).getAttribute('required')).toBeNull();

      // now form should be valid without peer credentials.
      expect(await saveButton.isDisabled()).toBe(false);
    });
  });
});
