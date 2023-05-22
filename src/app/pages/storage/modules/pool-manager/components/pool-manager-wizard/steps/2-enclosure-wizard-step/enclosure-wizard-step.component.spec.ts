import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { IxSelectHarness } from 'app/modules/ix-forms/components/ix-select/ix-select.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { DispersalStrategy, EnclosureWizardStepComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/2-enclosure-wizard-step/enclosure-wizard-step.component';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

describe('EnclosureWizardStepComponent', () => {
  let spectator: Spectator<EnclosureWizardStepComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: EnclosureWizardStepComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      mockProvider(PoolManagerStore, {
        enclosures$: of([{
          label: 'Fake enclosure',
          value: 55,
        }]),
        setEnclosureOptions: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('updates store once Maximize group option is selected', () => {
    spectator.component.form.patchValue({
      dispersalStrategy: DispersalStrategy.Maximize,
      limitToEnclosure: null,
    });

    expect(spectator.inject(PoolManagerStore).setEnclosureOptions).toHaveBeenCalledWith({
      limitToSingleEnclosure: null,
      maximizeEnclosureDispersal: true,
    });
  });

  it('updates store once None group option is selected', () => {
    spectator.component.form.patchValue({
      dispersalStrategy: DispersalStrategy.None,
      limitToEnclosure: null,
    });

    expect(spectator.inject(PoolManagerStore).setEnclosureOptions).toHaveBeenCalledWith({
      limitToSingleEnclosure: null,
      maximizeEnclosureDispersal: false,
    });
  });

  it('shows Enclosure dropdown once Limit to single group option is selected and updates store', async () => {
    spectator.component.form.patchValue({
      dispersalStrategy: DispersalStrategy.LimitToSingle,
      limitToEnclosure: 55,
    });

    const enclosureInput = await loader.getHarness(IxSelectHarness.with({ label: 'Enclosure' }));

    expect(await enclosureInput.getOptionLabels()).toEqual(['Fake enclosure']);

    expect(spectator.inject(PoolManagerStore).setEnclosureOptions).toHaveBeenCalledWith({
      limitToSingleEnclosure: 55,
      maximizeEnclosureDispersal: false,
    });
  });
});
