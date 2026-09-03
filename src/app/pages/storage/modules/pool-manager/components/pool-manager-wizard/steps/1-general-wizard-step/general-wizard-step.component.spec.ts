import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import {
  TnFormFieldHarness, TnInputHarness, TnRadioHarness, TnStepperComponent,
} from '@truenas/ui-components';
import { of, Subject } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { EntitlementReason } from 'app/enums/entitlement-reason.enum';
import { helptextPoolCreation } from 'app/helptext/storage/volumes/pool-creation/pool-creation';
import { Pool } from 'app/interfaces/pool.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { PoolWarningsComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/pool-warnings/pool-warnings.component';
import {
  GeneralWizardStepComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/1-general-wizard-step/general-wizard-step.component';
import { PoolWizardNameValidationService } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/1-general-wizard-step/pool-wizard-name-validation.service';
import { EncryptionType } from 'app/pages/storage/modules/pool-manager/enums/encryption-type.enum';
import { DiskStore } from 'app/pages/storage/modules/pool-manager/store/disk.store';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { selectEntitlements } from 'app/store/entitlements/entitlements.selectors';

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
      mockProvider(TnStepperComponent),
      mockApi([
        mockCall('pool.query', []),
        mockCall('pool.validate_name', true),
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
        encryptionType$: of(EncryptionType.None),
        setGeneralOptions: jest.fn(),
        setEncryptionOptions: jest.fn(),
        setDiskWarningOptions: jest.fn(),
      }),
      mockProvider(DiskStore, {
        selectableDisks$: of([]),
      }),
      provideMockStore({
        selectors: [
          // Loaded map with no gated keys, i.e. entitled to everything.
          { selector: selectEntitlements, value: {} },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  function getNameInput(): Promise<TnInputHarness> {
    return loader.getHarness(TnInputHarness.with({ selector: '[formControlName="name"]' }));
  }

  function selectEncryptionType(label: string): Promise<void> {
    return loader.getHarness(TnRadioHarness.with({ label })).then((radio) => radio.check());
  }

  it('updates store when name is edited', async () => {
    const nameInput = await getNameInput();
    await nameInput.setValue('newpool');

    expect(spectator.inject(PoolManagerStore).setGeneralOptions).toHaveBeenCalledWith({
      name: 'newpool',
      nameErrors: null,
    });
  });

  it('shows encryption type radio group with None and Software options when no SED disks', async () => {
    // The group label lives on the wrapping tn-form-field; assert it so the options aren't
    // just checked positionally against whatever radios happen to be in the DOM.
    expect(await loader.getHarness(TnFormFieldHarness.with({ label: 'Encryption' }))).toBeTruthy();

    const radios = await loader.getAllHarnesses(TnRadioHarness);

    expect(radios).toHaveLength(2);
    expect(await radios[0].getLabelText()).toBe('None');
    expect(await radios[1].getLabelText()).toBe('Software Encryption (ZFS)');
  });

  it('shows warning when Software Encryption is selected', async () => {
    await selectEncryptionType('Software Encryption (ZFS)');

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        message: helptextPoolCreation.encryptionMessage,
        buttonText: 'I Understand',
      }),
    );
  });

  it('updates store when Software Encryption is selected', async () => {
    await selectEncryptionType('Software Encryption (ZFS)');
    spectator.detectChanges();

    const nameInput = await getNameInput();
    await nameInput.setValue('test');

    expect(spectator.inject(PoolManagerStore).setEncryptionOptions).toHaveBeenCalledWith({
      encryptionType: EncryptionType.Software,
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
    const poolWithSed = { all_sed: true, name: 'testpool' } as Pool;
    spectator.setInput('isAddingVdevs', true);
    spectator.setInput('pool', poolWithSed);
    spectator.component.ngOnChanges();

    expect(spectator.component.form.getRawValue().encryptionType).toBe(EncryptionType.Sed);
  });

  it('disables encryption fields when adding VDEVs', () => {
    spectator.setInput('isAddingVdevs', true);
    spectator.component.ngOnChanges();

    expect(spectator.component.form.controls.encryptionType.disabled).toBe(true);
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
});

describe('GeneralWizardStepComponent with SED disks and no global password', () => {
  let spectator: Spectator<GeneralWizardStepComponent>;
  let loader: HarnessLoader;

  const startOver$ = new Subject<void>();

  const createComponent = createComponentFactory({
    component: GeneralWizardStepComponent,
    imports: [ReactiveFormsModule, PoolWarningsComponent],
    providers: [
      mockProvider(TnStepperComponent),
      mockApi([
        mockCall('pool.query', []),
        mockCall('pool.validate_name', true),
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
        hasSedCapableDisks$: of(true),
        encryptionType$: of(EncryptionType.None),
        setGeneralOptions: jest.fn(),
        setEncryptionOptions: jest.fn(),
        setDiskWarningOptions: jest.fn(),
      }),
      mockProvider(DiskStore, {
        selectableDisks$: of([]),
      }),
      provideMockStore({
        selectors: [
          // Loaded map with no gated keys, i.e. entitled to everything.
          { selector: selectEntitlements, value: {} },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('offers no SED encryption option when the system is not entitled to SED', async () => {
    // Same SED-capable disks as the test below; only the entitlement differs.
    spectator.inject(MockStore).overrideSelector(selectEntitlements, {
      [EntitlementFeature.Sed]: {
        entitled: false,
        reason: EntitlementReason.NoLicense,
        message: 'This system is not licensed to use the SED feature.',
      },
    });
    spectator.inject(MockStore).refreshState();
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);

    const sedRadio = await loader.getHarnessOrNull(TnRadioHarness.with({ label: 'Self Encrypting Drives (SED)' }));
    expect(sedRadio).toBeNull();

    // Software encryption is ungated and sits beside it — proves the radio group rendered.
    expect(await loader.getHarnessOrNull(TnRadioHarness.with({ label: 'Software Encryption (ZFS)' }))).not.toBeNull();
  });

  it('shows info message when no global SED password is set', async () => {
    await (await loader.getHarness(TnRadioHarness.with({ label: 'Self Encrypting Drives (SED)' }))).check();
    spectator.detectChanges();

    const infoMessage = spectator.query('ix-warning');
    expect(infoMessage).toBeTruthy();
    expect(infoMessage).toHaveText('The Global SED Password is a system-wide setting that applies to all pools using SED encryption.');
  });
});

describe('GeneralWizardStepComponent with existing SED password', () => {
  let spectator: Spectator<GeneralWizardStepComponent>;
  let loader: HarnessLoader;

  const startOver$ = new Subject<void>();

  const createComponent = createComponentFactory({
    component: GeneralWizardStepComponent,
    imports: [ReactiveFormsModule, PoolWarningsComponent],
    providers: [
      mockProvider(TnStepperComponent),
      mockApi([
        mockCall('pool.query', []),
        mockCall('pool.validate_name', true),
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
        encryptionType$: of(EncryptionType.None),
        setGeneralOptions: jest.fn(),
        setEncryptionOptions: jest.fn(),
        setDiskWarningOptions: jest.fn(),
      }),
      mockProvider(DiskStore, {
        selectableDisks$: of([]),
      }),
      provideMockStore({
        selectors: [
          // Loaded map with no gated keys, i.e. entitled to everything.
          { selector: selectEntitlements, value: {} },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows warning message when global SED password is already set', async () => {
    await (await loader.getHarness(TnRadioHarness.with({ label: 'Self Encrypting Drives (SED)' }))).check();
    spectator.detectChanges();

    const warningMessage = spectator.query('ix-warning');
    expect(warningMessage).toBeTruthy();
    expect(warningMessage).toHaveText('The Global SED Password is a system-wide setting. A password is already configured. Entering a new password here will update it for all pools using SED encryption.');
  });
});
