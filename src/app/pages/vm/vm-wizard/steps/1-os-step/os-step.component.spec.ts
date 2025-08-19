import { CdkStepper } from '@angular/cdk/stepper';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import {
  VmBootloader, VmOs, VmTime,
} from 'app/enums/vm.enum';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { OsStepComponent } from 'app/pages/vm/vm-wizard/steps/1-os-step/os-step.component';

describe('OsStepComponent', () => {
  let spectator: Spectator<OsStepComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: OsStepComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(CdkStepper),
      mockApi([
        mockCall('vm.query', []),
        mockCall('vm.bootloader_options', {
          UEFI: 'UEFI',
          UEFI_CSM: 'UEFI_CSM',
        }),
        mockCall('vm.device.bind_choices', {
          '0.0.0.0': '0.0.0.0',
          '10.10.16.82': '10.10.16.82',
        }),
      ]),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  async function fillForm(): Promise<void> {
    await form.fillForm({
      'Guest Operating System': 'Linux',
      'Enable Secure Boot': 'Linux',
      Name: 'vm1',
      Description: 'My first VM',
      'System Clock': 'UTC',
      'Boot Method': 'UEFI',
      'Shutdown Timeout': 90,
      'Start on Boot': true,
      'Enable Display (VNC)': true,
      Password: '12345678',
      Bind: '10.10.16.82',
    });
  }

  it('shows a form with basic VM fields like name, description, OS, etc.', async () => {
    await fillForm();

    expect(spectator.component.form.value).toEqual({
      os: VmOs.Linux,
      name: 'vm1',
      description: 'My first VM',
      time: VmTime.Utc,
      bootloader: VmBootloader.Uefi,
      shutdown_timeout: 90,
      autostart: true,
      enable_vnc: true,
      vnc_bind: '10.10.16.82',
      vnc_password: '12345678',
      hyperv_enlightenments: false,
      enable_secure_boot: true,
      trusted_platform_module: false,
    });
  });

  it('shows Hyper-V Enlightenments checkbox when Windows is selected as OS', async () => {
    await fillForm();

    await form.fillForm(
      {
        'Guest Operating System': 'Windows',
        'Enable Hyper-V Enlightenments': true,
      },
    );

    expect(spectator.component.form.value).toMatchObject({
      os: VmOs.Windows,
      hyperv_enlightenments: true,
    });
  });

  it('returns a summary when getSummary is called', async () => {
    await fillForm();

    expect(spectator.component.getSummary()).toEqual([
      {
        label: 'Name',
        value: 'vm1',
      },
      {
        label: 'Guest Operating System',
        value: 'Linux',
      },
    ]);
  });

  describe('VNC Display', () => {
    it('enables VNC fields when Enable Display (VNC) is checked', async () => {
      await form.fillForm({
        'Enable Display (VNC)': true,
      });

      const formValues = await form.getValues();
      expect(formValues).toMatchObject({
        'Enable Display (VNC)': true,
      });

      // VNC fields should be accessible
      expect(spectator.component.form.controls.vnc_bind.enabled).toBe(true);
      expect(spectator.component.form.controls.vnc_password.enabled).toBe(true);
    });

    it('disables VNC fields when Enable Display (VNC) is unchecked', async () => {
      await form.fillForm({
        'Enable Display (VNC)': true,
        Bind: '10.10.16.82',
        Password: 'vncpass',
      });

      await form.fillForm({
        'Enable Display (VNC)': false,
      });

      // VNC fields should be disabled
      expect(spectator.component.form.controls.vnc_bind.disabled).toBe(true);
      expect(spectator.component.form.controls.vnc_password.disabled).toBe(true);
    });

    it('validates VNC password with 8-character limit', async () => {
      await form.fillForm({
        'Enable Display (VNC)': true,
        Password: '123456789', // 9 characters - should be invalid
      });

      expect(spectator.component.form.controls.vnc_password.invalid).toBe(true);
      expect(spectator.component.form.controls.vnc_password.hasError('maxlength')).toBe(true);
    });

    it('accepts VNC password with 8 characters or less', async () => {
      await form.fillForm({
        'Enable Display (VNC)': true,
        Password: '12345678', // 8 characters - should be valid
      });

      expect(spectator.component.form.controls.vnc_password.valid).toBe(true);
    });

    it('requires VNC password when VNC is enabled', async () => {
      await form.fillForm({
        'Enable Display (VNC)': true,
        Password: '', // Empty password - should be invalid
      });

      expect(spectator.component.form.controls.vnc_password.invalid).toBe(true);
      expect(spectator.component.form.controls.vnc_password.hasError('required')).toBe(true);
    });

    it('shows VNC form values when enabled', async () => {
      await form.fillForm({
        'Enable Display (VNC)': true,
        Password: 'vncpass',
        Bind: '10.10.16.82',
      });

      expect(spectator.component.form.value).toMatchObject({
        enable_vnc: true,
        vnc_password: 'vncpass',
        vnc_bind: '10.10.16.82',
      });
    });

    it('shows complete form values with VNC enabled', async () => {
      await form.fillForm({
        'Guest Operating System': 'Linux',
        Name: 'vnc-test-vm',
        'Enable Display (VNC)': true,
        Password: 'vncpass',
        Bind: '10.10.16.82',
      });

      expect(spectator.component.form.value).toMatchObject({
        os: VmOs.Linux,
        name: 'vnc-test-vm',
        enable_vnc: true,
        vnc_password: 'vncpass',
        vnc_bind: '10.10.16.82',
      });
    });
  });
});
