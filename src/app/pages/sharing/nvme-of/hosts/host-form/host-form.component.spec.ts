import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { TnButtonHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { NvmeOfGlobalConfig, NvmeOfHost } from 'app/interfaces/nvme-of.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { HostFormComponent } from 'app/pages/sharing/nvme-of/hosts/host-form/host-form.component';

describe('HostFormComponent', () => {
  const savedHost = { id: 1 } as NvmeOfHost;
  const slideInGetData = jest.fn((): NvmeOfHost | undefined => undefined);
  const createComponent = createComponentFactory({
    component: HostFormComponent,
    providers: [
      mockApi([
        mockCall('nvmet.host.create', savedHost),
        mockCall('nvmet.host.update', savedHost),
        mockCall('nvmet.host.generate_key', '123456'),
        mockCall('nvmet.host.dhchap_hash_choices', ['SHA-256', 'SHA-512']),
        mockCall('nvmet.host.dhchap_dhgroup_choices', ['2048-BIT', '4096-BIT']),
        mockCall('nvmet.global.config', {
          basenqn: 'nqn.2011-06.com.truenas',
        } as NvmeOfGlobalConfig),
      ]),
      mockProvider(SlideInRef, {
        getData: slideInGetData,
        close: jest.fn(),
        requireConfirmationWhen: jest.fn(),
      }),
      mockProvider(AuthService, {
        hasRole: jest.fn(() => of(true)),
      }),
    ],
  });

  let spectator: ReturnType<typeof createComponent>;
  let component: HostFormComponent;
  let loader: HarnessLoader;
  let api: ApiService;
  let slideInRef: SlideInRef<NvmeOfHost | undefined, NvmeOfHost | null>;

  beforeEach(() => {
    slideInGetData.mockReturnValue(undefined);
    spectator = createComponent();
    component = spectator.component as HostFormComponent;
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
    slideInRef = spectator.inject(SlideInRef);
  });

  async function clickButton(label: string, index = 0): Promise<void> {
    const buttons = await loader.getAllHarnesses(TnButtonHarness.with({ label }));
    await buttons[index].click();
  }

  it('creates a new host when form is submitted', async () => {
    component.form.patchValue({
      hostnqn: 'nqn.2014-08.org',
      requireHostAuthentication: true,
      dhchap_key: '1234567890',
      dhchap_ctrl_key: '111222',
      addDhKeyExchange: true,
      dhchap_hash: 'SHA-512',
      dhchap_dhgroup: '2048-BIT',
    });
    spectator.detectChanges();

    await clickButton('Save');

    expect(api.call).toHaveBeenCalledWith('nvmet.host.create', [{
      hostnqn: 'nqn.2014-08.org',
      description: '',
      dhchap_key: '1234567890',
      dhchap_ctrl_key: '111222',
      dhchap_dhgroup: '2048-BIT',
      dhchap_hash: 'SHA-512',
    }]);
    expect(slideInRef.close).toHaveBeenCalledWith({
      response: savedHost,
    });
  });

  describe('edits', () => {
    beforeEach(() => {
      slideInGetData.mockReturnValue({
        id: 23,
        hostnqn: 'nqn.2014-08.org',
        dhchap_key: '1234567890',
        dhchap_ctrl_key: '111222',
        dhchap_dhgroup: '2048-BIT',
      } as NvmeOfHost);

      component.ngOnInit();
      spectator.detectChanges();
    });

    it('shows current values when editing an existing host', () => {
      expect(component.form.getRawValue()).toMatchObject({
        hostnqn: 'nqn.2014-08.org',
        description: '',
        requireHostAuthentication: true,
        dhchap_key: '1234567890',
        dhchap_ctrl_key: '111222',
        addDhKeyExchange: true,
        dhchap_hash: 'SHA-256',
        dhchap_dhgroup: '2048-BIT',
      });
    });

    it('updates an existing host', async () => {
      component.form.patchValue({
        hostnqn: 'nqn.2014-09.org',
        requireHostAuthentication: false,
      });
      spectator.detectChanges();

      await clickButton('Save');

      expect(api.call).toHaveBeenCalledWith('nvmet.host.update', [23, {
        hostnqn: 'nqn.2014-09.org',
        description: '',
        dhchap_key: null,
        dhchap_ctrl_key: '111222',
        dhchap_hash: 'SHA-256',
        dhchap_dhgroup: null,
      }]);
    });
  });

  describe('key generation', () => {
    it('generates a host key when host authentication is enabled and Generate Key button is pressed', async () => {
      component.form.patchValue({
        hostnqn: 'nqn.2014-08.org',
        requireHostAuthentication: true,
      });
      spectator.detectChanges();

      await clickButton('Generate Key');

      expect(api.call).toHaveBeenCalledWith('nvmet.host.generate_key', ['SHA-256', 'nqn.2014-08.org']);
      expect(component.form.controls.dhchap_key.value).toBe('123456');
    });

    it('generates TrueNAS key using basenqn from settings when the other Generate Key is pressed', async () => {
      component.form.patchValue({
        hostnqn: 'nqn.2014-08.org',
        requireHostAuthentication: true,
      });
      spectator.detectChanges();

      await clickButton('Generate Key', 1);

      expect(api.call).toHaveBeenCalledWith('nvmet.global.config');
      expect(api.call).toHaveBeenCalledWith('nvmet.host.generate_key', ['SHA-256', 'nqn.2011-06.com.truenas']);
      expect(component.form.controls.dhchap_ctrl_key.value).toBe('123456');
    });
  });

  describe('nqn validation', () => {
    it('shows error when NQN does not start with nqn.', () => {
      component.form.controls.hostnqn.setValue('invalid.2014-08.org.example');

      expect(component.form.controls.hostnqn.errors).toEqual({
        nqnFormat: {
          message: 'Host NQN must start with "nqn." followed by a date and domain (e.g., nqn.2014-08.org.nvmexpress)',
        },
      });
    });

    it('shows error when NQN is too short', () => {
      component.form.controls.hostnqn.setValue('nqn.2014');

      expect(component.form.controls.hostnqn.errors).toEqual({
        nqnMinLength: {
          message: 'Host NQN must be at least 11 characters long',
        },
      });
    });

    it('shows error when NQN is too long', () => {
      const longNqn = 'nqn.2014-08.' + 'a'.repeat(212);
      component.form.controls.hostnqn.setValue(longNqn);

      expect(component.form.controls.hostnqn.errors).toEqual({
        nqnMaxLength: {
          message: 'Host NQN cannot exceed 223 characters',
        },
      });
    });

    it('shows error when NQN format is invalid', () => {
      component.form.controls.hostnqn.setValue('nqn.invalid-date.org');

      expect(component.form.controls.hostnqn.errors).toEqual({
        nqnInvalid: {
          message: 'Invalid NQN format. Must be: nqn.YYYY-MM.reverse-domain-name (e.g., nqn.2014-08.com.example or nqn.2014-08.org.nvmexpress:host1)',
        },
      });
    });

    it('accepts valid NQN with date and domain', () => {
      component.form.controls.hostnqn.setValue('nqn.2014-08.org.nvmexpress');

      expect(component.form.controls.hostnqn.errors).toBeNull();
    });

    it('accepts valid NQN with optional identifier', () => {
      component.form.controls.hostnqn.setValue('nqn.2014-08.com.example:host1');

      expect(component.form.controls.hostnqn.errors).toBeNull();
    });

    it('accepts valid NQN with multiple domain parts', () => {
      component.form.controls.hostnqn.setValue('nqn.2014-08.com.example.storage');

      expect(component.form.controls.hostnqn.errors).toBeNull();
    });
  });

  describe('description field', () => {
    it('submits description when creating a new host', async () => {
      component.form.patchValue({
        hostnqn: 'nqn.2014-08.org.example',
        description: 'Test host description',
      });
      spectator.detectChanges();

      await clickButton('Save');

      expect(api.call).toHaveBeenLastCalledWith('nvmet.host.create', [{
        hostnqn: 'nqn.2014-08.org.example',
        description: 'Test host description',
        dhchap_key: null,
        dhchap_ctrl_key: null,
        dhchap_hash: 'SHA-256',
        dhchap_dhgroup: null,
      }]);
    });

    it('updates description when editing an existing host', async () => {
      slideInGetData.mockReturnValue({
        id: 24,
        hostnqn: 'nqn.2014-08.org',
        description: 'Old description',
      } as NvmeOfHost);

      component.ngOnInit();

      component.form.patchValue({
        description: 'Updated description',
      });
      spectator.detectChanges();

      await clickButton('Save');

      expect(api.call).toHaveBeenLastCalledWith('nvmet.host.update', [24, {
        hostnqn: 'nqn.2014-08.org',
        description: 'Updated description',
        dhchap_key: null,
        dhchap_ctrl_key: null,
        dhchap_hash: 'SHA-256',
        dhchap_dhgroup: null,
      }]);
    });
  });
});
