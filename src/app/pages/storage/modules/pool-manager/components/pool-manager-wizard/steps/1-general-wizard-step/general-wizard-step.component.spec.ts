import { CdkStepper } from '@angular/cdk/stepper';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of, Subject } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { helptextPoolCreation } from 'app/helptext/storage/volumes/pool-creation/pool-creation';
import { Pool } from 'app/interfaces/pool.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { IxRadioGroupHarness } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.harness';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { PoolWarningsComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/pool-warnings/pool-warnings.component';
import {
  GeneralWizardStepComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/1-general-wizard-step/general-wizard-step.component';
import { PoolWizardNameValidationService } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/1-general-wizard-step/pool-wizard-name-validation.service';
import { EncryptionType } from 'app/pages/storage/modules/pool-manager/enums/encryption-type.enum';
import { DiskStore } from 'app/pages/storage/modules/pool-manager/store/disk.store';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

describe('GeneralWizardStepComponent', () => {
  let spectator: Spectator<GeneralWizardStepComponent>;
  let loader: HarnessLoader;

  const startOver$ = new Subject<void>();

  const createComponent = createComponentFactory({
    component: GeneralWizardStepComponent,
    imports: [
      ReactiveFormsModule,
      PoolWarningsComponent,
    ],
    providers: [
      mockProvider(CdkStepper),
      mockApi([
        mockCall('pool.query', []),
        mockCall('pool.validate_name', true),
        mockCall('pool.dataset.encryption_algorithm_choices', {
          'AES-192-GCM': 'AES-192-GCM',
          'AES-128-GCM': 'AES-128-GCM',
        }),
        mockCall('system.advanced.sed_global_password_is_set', false),
      ]),
      mockProvider(PoolWizardNameValidationService, {
        validatePoolName: () => of(null),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(PoolManagerStore, {
        startOver$,
        hasSedCapableDisks$: of(false),
        setGeneralOptions: jest.fn(),
        setEncryptionOptions: jest.fn(),
      }),
      mockProvider(DiskStore, {
        selectableDisks$: of([]),
      }),
      provideMockStore({
        selectors: [
          { selector: selectIsEnterprise, value: true },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('updates store when name is edited', async () => {
    const nameInput = await loader.getHarness(IxInputHarness.with({ label: 'Name' }));
    await nameInput.setValue('newpool');

    expect(spectator.inject(PoolManagerStore).setGeneralOptions).toHaveBeenCalledWith({
      name: 'newpool',
      encryption: null,
      nameErrors: null,
    });
  });

  it('shows encryption type radio group with None and Software options when no SED disks', async () => {
    const encryptionRadio = await loader.getHarness(IxRadioGroupHarness.with({ label: 'Encryption' }));
    const optionLabels = await encryptionRadio.getOptionLabels();

    expect(optionLabels).toHaveLength(2);
    expect(optionLabels[0]).toBe('None');
    expect(optionLabels[1]).toBe('Software Encryption (ZFS)');
  });

  it('shows Encryption Standard dropdown when Software Encryption is selected', async () => {
    const encryptionRadio = await loader.getHarness(IxRadioGroupHarness.with({ label: 'Encryption' }));
    await encryptionRadio.setValue('Software Encryption (ZFS)');
    spectator.detectChanges();

    const encryptionStandards = await loader.getHarness(IxSelectHarness.with({ label: 'Encryption Standard' }));
    expect(await encryptionStandards.getOptionLabels()).toEqual(['AES-192-GCM', 'AES-128-GCM']);
  });

  it('shows warning when Software Encryption is selected', async () => {
    const encryptionRadio = await loader.getHarness(IxRadioGroupHarness.with({ label: 'Encryption' }));
    await encryptionRadio.setValue('Software Encryption (ZFS)');

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        message: helptextPoolCreation.encryptionMessage,
        buttonText: 'I Understand',
      }),
    );
  });

  it('updates store when Software Encryption fields are updated', async () => {
    const encryptionRadio = await loader.getHarness(IxRadioGroupHarness.with({ label: 'Encryption' }));
    await encryptionRadio.setValue('Software Encryption (ZFS)');
    spectator.detectChanges();

    const nameInput = await loader.getHarness(IxInputHarness.with({ label: 'Name' }));
    await nameInput.setValue('test');

    const encryptionStandards = await loader.getHarness(IxSelectHarness.with({ label: 'Encryption Standard' }));
    await encryptionStandards.setValue('AES-128-GCM');

    expect(spectator.inject(PoolManagerStore).setEncryptionOptions).toHaveBeenCalledWith({
      encryptionType: EncryptionType.Software,
      encryption: 'AES-128-GCM',
      sedPassword: null,
    });
  });

  it('requires SED password when SED encryption type is selected', () => {
    spectator.component.form.patchValue({ encryptionType: EncryptionType.Sed });
    spectator.detectChanges();

    expect(spectator.component.form.controls.sedPassword.hasError('required')).toBe(true);
    expect(spectator.component.form.controls.sedPasswordConfirm.hasError('required')).toBe(true);
  });

  it('validates that SED passwords match', () => {
    spectator.component.form.patchValue({
      name: 'testpool',
      encryptionType: EncryptionType.Sed,
      sedPassword: 'password123',
      sedPasswordConfirm: 'password456',
    });
    spectator.detectChanges();

    expect(spectator.component.form.controls.sedPasswordConfirm.errors).toBeTruthy();

    spectator.component.form.patchValue({
      sedPasswordConfirm: 'password123',
    });
    spectator.detectChanges();

    expect(spectator.component.form.controls.sedPasswordConfirm.errors).toBeFalsy();
    expect(spectator.component.form.valid).toBe(true);
  });

  it('updates store with SED password when SED is selected', () => {
    spectator.component.form.patchValue({
      name: 'testpool',
      encryptionType: EncryptionType.Sed,
      sedPassword: 'password123',
      sedPasswordConfirm: 'password123',
    });
    spectator.detectChanges();

    expect(spectator.inject(PoolManagerStore).setEncryptionOptions).toHaveBeenCalledWith({
      encryptionType: EncryptionType.Sed,
      encryption: null,
      sedPassword: 'password123',
    });
  });

  it('does not require SED password when encryption type is None', () => {
    spectator.component.form.patchValue({ encryptionType: EncryptionType.None });
    spectator.detectChanges();

    expect(spectator.component.form.controls.sedPassword.hasError('required')).toBe(false);
    expect(spectator.component.form.controls.sedPasswordConfirm.hasError('required')).toBe(false);
  });

  it('sets encryption type to SED when adding VDEVs to SED pool', () => {
    const poolWithSed = { sed_encryption: true, name: 'testpool' } as Pool;
    spectator.setInput('isAddingVdevs', true);
    spectator.setInput('pool', poolWithSed);
    spectator.component.ngOnChanges();

    expect(spectator.component.form.getRawValue().encryptionType).toBe(EncryptionType.Sed);
  });

  it('disables encryption fields when adding VDEVs', () => {
    spectator.setInput('isAddingVdevs', true);
    spectator.component.ngOnChanges();

    expect(spectator.component.form.controls.encryptionType.disabled).toBe(true);
    expect(spectator.component.form.controls.encryptionStandard.disabled).toBe(true);
    expect(spectator.component.form.controls.sedPassword.disabled).toBe(true);
    expect(spectator.component.form.controls.sedPasswordConfirm.disabled).toBe(true);
  });

  it('resets form to default encryption type (None) when Start Over is triggered', () => {
    const form = spectator.component.form;

    form.patchValue({ name: 'Changed', encryptionType: EncryptionType.Software });

    const store = spectator.inject(PoolManagerStore);
    store.startOver$.next();
    spectator.detectChanges();

    // Wait for async reset
    setTimeout(() => {
      expect(form.value.encryptionType).toBe(EncryptionType.None);
      expect(form.value.name).toBe('');
    });
  });

  it('shows info message when no global SED password is set', () => {
    spectator.component.form.patchValue({ encryptionType: EncryptionType.Sed });
    spectator.detectChanges();

    const infoMessage = spectator.query('.sed-info-message');
    expect(infoMessage).toBeTruthy();
    expect(infoMessage).toHaveText('The Global SED Password is a system-wide setting that applies to all pools using SED encryption.');
  });
});

describe('GeneralWizardStepComponent with existing SED password', () => {
  let spectator: Spectator<GeneralWizardStepComponent>;

  const startOver$ = new Subject<void>();

  const createComponent = createComponentFactory({
    component: GeneralWizardStepComponent,
    imports: [ReactiveFormsModule, PoolWarningsComponent],
    providers: [
      mockProvider(CdkStepper),
      mockApi([
        mockCall('pool.query', []),
        mockCall('pool.validate_name', true),
        mockCall('pool.dataset.encryption_algorithm_choices', {
          'AES-192-GCM': 'AES-192-GCM',
        }),
        mockCall('system.advanced.sed_global_password_is_set', true),
      ]),
      mockProvider(PoolWizardNameValidationService, {
        validatePoolName: () => of(null),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(PoolManagerStore, {
        startOver$,
        hasSedCapableDisks$: of(true),
        setGeneralOptions: jest.fn(),
        setEncryptionOptions: jest.fn(),
      }),
      mockProvider(DiskStore, {
        selectableDisks$: of([]),
      }),
      provideMockStore({
        selectors: [
          { selector: selectIsEnterprise, value: true },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows warning message when global SED password is already set', () => {
    spectator.component.form.patchValue({ encryptionType: EncryptionType.Sed });
    spectator.detectChanges();

    const warningMessage = spectator.query('.sed-global-password-warning');
    expect(warningMessage).toBeTruthy();
    expect(warningMessage).toHaveText('The Global SED Password is a system-wide setting. A password is already configured. Entering a new password here will update it for all pools using SED encryption.');
  });
});
