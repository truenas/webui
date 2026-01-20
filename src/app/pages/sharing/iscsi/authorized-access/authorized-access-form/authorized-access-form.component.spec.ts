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
    discovery_auth: 'CHAP_MUTUAL',
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
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('iscsi.auth.create', [{
        tag: 113,
        user: 'new-user',
        secret: '123456789012',
        peeruser: '',
        peersecret: '',
        discovery_auth: 'NONE',
      }]);
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });

    it('add new authorized access with mutual CHAP when form is submitted', async () => {
      await form.fillForm({
        'Group ID': '113',
        'Discovery Authentication': 'Mutual CHAP',
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
        discovery_auth: 'CHAP_MUTUAL',
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
        'Discovery Authentication': 'Mutual CHAP',
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
        User: 'updated-user',
        'Peer User': 'updated-peer',
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
            peeruser: 'updated-peer',
            peersecret: 'peer123456789012',
            discovery_auth: 'CHAP_MUTUAL',
          },
        ],
      );
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });

    it('allows switching from Mutual CHAP to NONE and clears peer fields', async () => {
      await form.fillForm({
        'Discovery Authentication': 'NONE',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
        'iscsi.auth.update',
        [
          123,
          {
            tag: 23,
            user: 'user',
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

    it('hides peer fields by default when Mutual CHAP is not selected', async () => {
      const controls = await form.getControlHarnessesDict();

      expect(controls['Peer User']).toBeUndefined();
      expect(controls['Peer Secret']).toBeUndefined();
      expect(controls['Peer Secret (Confirm)']).toBeUndefined();
    });

    it('shows peer fields when Mutual CHAP is selected', async () => {
      await form.fillForm({
        'Discovery Authentication': 'Mutual CHAP',
      });

      const controls = await form.getControlHarnessesDict();

      expect(controls['Peer User']).toBeDefined();
      expect(controls['Peer Secret']).toBeDefined();
      expect(controls['Peer Secret (Confirm)']).toBeDefined();
    });

    it('makes peer fields required when Mutual CHAP is selected', async () => {
      await form.fillForm({
        'Group ID': '113',
        User: 'test-user',
        Secret: '123456789012',
        'Secret (Confirm)': '123456789012',
        'Discovery Authentication': 'Mutual CHAP',
        'Peer User': '',
        'Peer Secret': '',
        'Peer Secret (Confirm)': '',
      });

      const peerUserControl = await form.getControl('Peer User') as IxInputHarness;
      const peerSecretControl = await form.getControl('Peer Secret') as IxInputHarness;
      const peerSecretConfirmControl = await form.getControl('Peer Secret (Confirm)') as IxInputHarness;

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
        'Discovery Authentication': 'Mutual CHAP',
        'Peer User': 'peer-user',
        'Peer Secret': 'peer123456789012',
        'Peer Secret (Confirm)': 'peer123456789012',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(false);
    });

    it('hides peer fields when switching from Mutual CHAP to another auth method', async () => {
      await form.fillForm({
        'Discovery Authentication': 'Mutual CHAP',
        'Peer User': 'peer-user',
        'Peer Secret': 'peer123456789012',
        'Peer Secret (Confirm)': 'peer123456789012',
      });

      let controls = await form.getControlHarnessesDict();
      expect(controls['Peer User']).toBeDefined();

      // switch to regular CHAP (not mutual)
      await form.fillForm({
        'Group ID': '113',
        User: 'test-user',
        Secret: '123456789012',
        'Secret (Confirm)': '123456789012',
        'Discovery Authentication': 'CHAP',
      });

      // now, all peer-related fields should disappear from the harness
      controls = await form.getControlHarnessesDict();
      expect(controls['Peer User']).toBeUndefined();
      expect(controls['Peer Secret']).toBeUndefined();
      expect(controls['Peer Secret (Confirm)']).toBeUndefined();

      // the form should be valid too, since we cleared the peer fields in the logic
      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(false);
    });
  });
});
