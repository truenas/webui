import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of, Subject } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import helptext from 'app/helptext/storage/volumes/manager/manager';
import { IxCheckboxHarness } from 'app/modules/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxInputHarness } from 'app/modules/ix-forms/components/ix-input/ix-input.harness';
import { IxSelectHarness } from 'app/modules/ix-forms/components/ix-select/ix-select.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { PoolWarningsComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/pool-warnings/pool-warnings.component';
import {
  GeneralWizardStepComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/1-general-wizard-step/general-wizard-step.component';
import { PoolWizardNameValidationService } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/1-general-wizard-step/pool-wizard-name-validation.service';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { DialogService } from 'app/services/dialog.service';

describe('GeneralWizardStepComponent', () => {
  let spectator: Spectator<GeneralWizardStepComponent>;
  let loader: HarnessLoader;

  const startOver$ = new Subject<void>();

  const createComponent = createComponentFactory({
    component: GeneralWizardStepComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    declarations: [
      PoolWarningsComponent,
    ],
    providers: [
      mockWebsocket([
        mockCall('pool.query', []),
        mockCall('pool.validate_name', true),
        mockCall('pool.dataset.encryption_algorithm_choices', {
          'AES-192-GCM': 'AES-192-GCM',
          'AES-128-GCM': 'AES-128-GCM',
        }),
      ]),
      mockProvider(PoolWizardNameValidationService, {
        validatePoolName: () => of(null),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(PoolManagerStore, {
        allDisks$: of([]),
        startOver$,
        setGeneralOptions: jest.fn(),
        setDiskWarningOptions: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        isStepActive: true,
      },
    });
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

  it('shows an Encryption Standard dropdown when encryption is ticked', async () => {
    const encryptionCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Encryption' }));
    await encryptionCheckbox.setValue(true);

    const encryptionStandards = await loader.getHarness(IxSelectHarness.with({ label: 'Encryption Standard' }));
    expect(await encryptionStandards.getOptionLabels()).toEqual(['AES-192-GCM', 'AES-128-GCM']);
  });

  it('updates store Encryption fields are updated', async () => {
    const encryptionCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Encryption' }));
    await encryptionCheckbox.setValue(true);
    spectator.detectChanges();

    const nameInput = await loader.getHarness(IxInputHarness.with({ label: 'Name' }));
    await nameInput.setValue('test');

    const encryptionStandards = await loader.getHarness(IxSelectHarness.with({ label: 'Encryption Standard' }));
    await encryptionStandards.setValue('AES-128-GCM');

    expect(spectator.inject(PoolManagerStore).setGeneralOptions).toHaveBeenCalledWith({
      name: 'test',
      encryption: 'AES-128-GCM',
      nameErrors: null,
    });
  });

  it('shows a warning when Encryption checkbox is ticked', async () => {
    const encryptionCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Encryption' }));
    await encryptionCheckbox.setValue(true);

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        message: helptext.manager_encryption_message,
        buttonText: 'I Understand',
      }),
    );
  });

  it('resets form if Start Over confirmed', () => {
    const form = spectator.component.form;

    form.patchValue({ name: 'Changed', encryption: true });

    expect(form.value).toStrictEqual({ encryption: true, encryptionStandard: 'AES-256-GCM', name: 'Changed' });

    const store = spectator.inject(PoolManagerStore);
    store.startOver$.next();

    expect(form.value).toStrictEqual({ encryption: null, encryptionStandard: 'AES-256-GCM', name: null });
  });
});
