import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnCheckboxHarness, TnInputHarness, TnSelectHarness, TnStepperComponent,
} from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import {
  VmBootloader, VmOs, VmTime,
} from 'app/enums/vm.enum';
import { OsStepComponent } from 'app/pages/vm/vm-wizard/steps/1-os-step/os-step.component';

describe('OsStepComponent', () => {
  let spectator: Spectator<OsStepComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: OsStepComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(TnStepperComponent),
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

  async function setInput(controlName: string, value: string): Promise<void> {
    const input = await loader.getHarness(TnInputHarness.with({ selector: `[formControlName="${controlName}"]` }));
    await input.setValue(value);
  }

  async function setSelect(controlName: string, optionLabel: string): Promise<void> {
    const select = await loader.getHarness(TnSelectHarness.with({ selector: `[formControlName="${controlName}"]` }));
    await select.selectOption(optionLabel);
  }

  async function setCheckbox(controlName: string, checked: boolean): Promise<void> {
    const checkbox = await loader.getHarness(
      TnCheckboxHarness.with({ selector: `[formControlName="${controlName}"]` }),
    );
    if (checked) {
      await checkbox.check();
    } else {
      await checkbox.uncheck();
    }
  }

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  async function fillForm(): Promise<void> {
    await setSelect('os', 'Linux');
    await setCheckbox('enable_secure_boot', true);
    await setInput('name', 'vm1');
    await setInput('description', 'My first VM');
    await setSelect('time', 'UTC');
    await setSelect('bootloader', 'UEFI');
    await setInput('shutdown_timeout', '90');
    await setCheckbox('autostart', true);
    await setCheckbox('enable_vnc', true);
    await setInput('vnc_password', '12345678');
    await setSelect('vnc_bind', '10.10.16.82');
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

    await setSelect('os', 'Windows');
    await setCheckbox('hyperv_enlightenments', true);

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
      await setCheckbox('enable_vnc', true);

      const vncCheckbox = await loader.getHarness(
        TnCheckboxHarness.with({ selector: '[formControlName="enable_vnc"]' }),
      );
      expect(await vncCheckbox.isChecked()).toBe(true);

      // VNC fields should be accessible
      expect(spectator.component.form.controls.vnc_bind.enabled).toBe(true);
      expect(spectator.component.form.controls.vnc_password.enabled).toBe(true);
    });

    it('disables VNC fields when Enable Display (VNC) is unchecked', async () => {
      await setCheckbox('enable_vnc', true);
      await setSelect('vnc_bind', '10.10.16.82');
      await setInput('vnc_password', 'vncpass');

      await setCheckbox('enable_vnc', false);

      // VNC fields should be disabled
      expect(spectator.component.form.controls.vnc_bind.disabled).toBe(true);
      expect(spectator.component.form.controls.vnc_password.disabled).toBe(true);
    });

    it('validates VNC password with 8-character limit', async () => {
      await setCheckbox('enable_vnc', true);
      await setInput('vnc_password', '123456789'); // 9 characters - should be invalid

      expect(spectator.component.form.controls.vnc_password.invalid).toBe(true);
      expect(spectator.component.form.controls.vnc_password.hasError('maxlength')).toBe(true);
    });

    it('accepts VNC password with 8 characters or less', async () => {
      await setCheckbox('enable_vnc', true);
      await setInput('vnc_password', '12345678'); // 8 characters - should be valid

      expect(spectator.component.form.controls.vnc_password.valid).toBe(true);
    });

    it('requires VNC password when VNC is enabled', async () => {
      await setCheckbox('enable_vnc', true);
      // TnInputHarness.setValue('') cannot send empty keys; set the control directly.
      spectator.component.form.controls.vnc_password.setValue('');
      spectator.component.form.controls.vnc_password.markAsTouched();

      expect(spectator.component.form.controls.vnc_password.invalid).toBe(true);
      expect(spectator.component.form.controls.vnc_password.hasError('required')).toBe(true);
    });

    it('shows VNC form values when enabled', async () => {
      await setCheckbox('enable_vnc', true);
      await setInput('vnc_password', 'vncpass');
      await setSelect('vnc_bind', '10.10.16.82');

      expect(spectator.component.form.value).toMatchObject({
        enable_vnc: true,
        vnc_password: 'vncpass',
        vnc_bind: '10.10.16.82',
      });
    });

    it('shows complete form values with VNC enabled', async () => {
      await setSelect('os', 'Linux');
      await setInput('name', 'vnc-test-vm');
      await setCheckbox('enable_vnc', true);
      await setInput('vnc_password', 'vncpass');
      await setSelect('vnc_bind', '10.10.16.82');

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
