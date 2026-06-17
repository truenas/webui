import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness, TnSelectHarness } from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IscsiAuthAccess } from 'app/interfaces/iscsi.interface';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  AuthorizedAccessFormComponent,
} from 'app/pages/sharing/iscsi/authorized-access/authorized-access-form/authorized-access-form.component';

describe('AuthorizedAccessFormComponent', () => {
  let spectator: Spectator<AuthorizedAccessFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

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

  const setInput = async (name: string, value: string): Promise<void> => {
    await (await loader.getHarness(TnInputHarness.with({ name }))).setValue(value);
  };

  const inputNames = async (): Promise<string[]> => {
    const inputs = await loader.getAllHarnesses(TnInputHarness);
    return Promise.all(inputs.map((input) => input.getName()));
  };

  const createComponent = createComponentFactory({
    component: AuthorizedAccessFormComponent,
    imports: [ReactiveFormsModule],
    providers: [
      ...ixFormTestingProviders(),
      mockApi([
        mockCall('iscsi.auth.create'),
        mockCall('iscsi.auth.update'),
      ]),
      mockProvider(SlideInRef, slideInRef),
      mockAuth(),
    ],
  });

  describe('create authorized access', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('hides peer fields until Mutual CHAP is selected', async () => {
      expect(await inputNames()).not.toContain('peeruser');

      await (await loader.getHarness(TnSelectHarness)).selectOption('Mutual CHAP');

      expect(await inputNames()).toContain('peeruser');
    });

    it('adds new authorized access with NONE auth and empty peer credentials', async () => {
      await setInput('tag', '113');
      await setInput('user', 'new-user');
      await setInput('secret', '123456789012');
      await setInput('secret_confirm', '123456789012');

      await (await loader.getHarness(MatButtonHarness.with({ text: 'Save' }))).click();

      expect(api.call).toHaveBeenCalledWith('iscsi.auth.create', [{
        tag: 113,
        user: 'new-user',
        secret: '123456789012',
        peeruser: '',
        peersecret: '',
        discovery_auth: 'NONE',
      }]);
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });

    it('adds new authorized access with Mutual CHAP and peer credentials', async () => {
      await setInput('tag', '113');
      await (await loader.getHarness(TnSelectHarness)).selectOption('Mutual CHAP');
      await setInput('user', 'new-user');
      await setInput('secret', '123456789012');
      await setInput('secret_confirm', '123456789012');
      await setInput('peeruser', 'new-peer');
      await setInput('peersecret', 'peer123456789012');
      await setInput('peersecret_confirm', 'peer123456789012');

      await (await loader.getHarness(MatButtonHarness.with({ text: 'Save' }))).click();

      expect(api.call).toHaveBeenCalledWith('iscsi.auth.create', [{
        tag: 113,
        user: 'new-user',
        secret: '123456789012',
        peeruser: 'new-peer',
        peersecret: 'peer123456789012',
        discovery_auth: 'CHAP_MUTUAL',
      }]);
    });

    it('keeps Save disabled until required peer fields are filled for Mutual CHAP', async () => {
      await setInput('tag', '113');
      await setInput('user', 'test-user');
      await setInput('secret', '123456789012');
      await setInput('secret_confirm', '123456789012');
      await (await loader.getHarness(TnSelectHarness)).selectOption('Mutual CHAP');

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(true);

      await setInput('peeruser', 'peer-user');
      await setInput('peersecret', 'peer123456789012');
      await setInput('peersecret_confirm', 'peer123456789012');

      expect(await saveButton.isDisabled()).toBe(false);
    });

    it('hides peer fields and frees Save when switching from Mutual CHAP to CHAP', async () => {
      await setInput('tag', '113');
      await setInput('user', 'test-user');
      await setInput('secret', '123456789012');
      await setInput('secret_confirm', '123456789012');
      await (await loader.getHarness(TnSelectHarness)).selectOption('Mutual CHAP');
      expect(await inputNames()).toContain('peeruser');

      await (await loader.getHarness(TnSelectHarness)).selectOption('CHAP');

      expect(await inputNames()).not.toContain('peeruser');
      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(false);
    });
  });

  describe('edit existing authorized access', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: () => existingAuthorizedAccess }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('shows existing values, including peer fields revealed by Mutual CHAP', async () => {
      expect(await (await loader.getHarness(TnInputHarness.with({ name: 'tag' }))).getValue()).toBe('23');
      expect(await (await loader.getHarness(TnInputHarness.with({ name: 'user' }))).getValue()).toBe('user');
      expect(await (await loader.getHarness(TnInputHarness.with({ name: 'peeruser' }))).getValue()).toBe('peer');
      expect(await (await loader.getHarness(TnInputHarness.with({ name: 'peersecret' }))).getValue())
        .toBe('peer123456789012');
    });

    it('updates the access when saved', async () => {
      await setInput('tag', '120');
      await setInput('user', 'updated-user');
      await setInput('peeruser', 'updated-peer');

      await (await loader.getHarness(MatButtonHarness.with({ text: 'Save' }))).click();

      expect(api.call).toHaveBeenCalledWith('iscsi.auth.update', [123, {
        tag: 120,
        user: 'updated-user',
        secret: '123456789012',
        peeruser: 'updated-peer',
        peersecret: 'peer123456789012',
        discovery_auth: 'CHAP_MUTUAL',
      }]);
    });

    it('clears peer credentials when switching to NONE', async () => {
      await (await loader.getHarness(TnSelectHarness)).selectOption('NONE');

      await (await loader.getHarness(MatButtonHarness.with({ text: 'Save' }))).click();

      expect(api.call).toHaveBeenCalledWith('iscsi.auth.update', [123, {
        tag: 23,
        user: 'user',
        secret: '123456789012',
        peeruser: '',
        peersecret: '',
        discovery_auth: 'NONE',
      }]);
    });
  });
});
