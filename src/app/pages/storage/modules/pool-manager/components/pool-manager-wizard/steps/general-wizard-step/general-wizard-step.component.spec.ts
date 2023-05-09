import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import helptext from 'app/helptext/storage/volumes/manager/manager';
import { IxCheckboxHarness } from 'app/modules/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxInputHarness } from 'app/modules/ix-forms/components/ix-input/ix-input.harness';
import { IxSelectHarness } from 'app/modules/ix-forms/components/ix-select/ix-select.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import {
  PoolManagerWizardComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/pool-manager-wizard.component';
import {
  GeneralWizardStepComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/general-wizard-step/general-wizard-step.component';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pools-manager-store.service';
import { DialogService } from 'app/services';

describe('GeneralWizardStepComponent', () => {
  let spectator: Spectator<GeneralWizardStepComponent>;
  let loader: HarnessLoader;
  let formGroup: PoolManagerWizardComponent['form']['controls']['general'];
  const createComponent = createComponentFactory({
    component: GeneralWizardStepComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('pool.query', []),
        mockCall('pool.dataset.encryption_algorithm_choices', {
          'AES-192-GCM': 'AES-192-GCM',
          'AES-128-GCM': 'AES-128-GCM',
        }),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(PoolManagerStore, {
        nonUniqueSerialDisks$: of([]),
      }),
    ],
  });

  beforeEach(() => {
    formGroup = new FormGroup({
      name: new FormControl(''),
      encryption: new FormControl(false),
      encryption_standard: new FormControl('AES-256-GCM'),
    }) as unknown as PoolManagerWizardComponent['form']['controls']['general'];

    spectator = createComponent({
      props: {
        form: formGroup,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows a pool name input', async () => {
    const nameInput = await loader.getHarness(IxInputHarness.with({ label: 'Name' }));
    await nameInput.setValue('newpool');

    expect(formGroup.value).toMatchObject({
      name: 'newpool',
    });
  });

  it('shows an Encryption Standard dropdown when encryption is ticked', async () => {
    const encryptionCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Encryption' }));
    await encryptionCheckbox.setValue(true);

    const encryptionStandards = await loader.getHarness(IxSelectHarness.with({ label: 'Encryption Standard' }));
    expect(await encryptionStandards.getOptionLabels()).toEqual(['AES-192-GCM', 'AES-128-GCM']);
  });

  it('updates form group when Encryption fields are updated', async () => {
    const encryptionCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Encryption' }));
    await encryptionCheckbox.setValue(true);
    spectator.detectChanges();

    const encryptionStandards = await loader.getHarness(IxSelectHarness.with({ label: 'Encryption Standard' }));
    await encryptionStandards.setValue('AES-128-GCM');

    expect(formGroup.value).toMatchObject({
      encryption: true,
      encryption_standard: 'AES-128-GCM',
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
});
