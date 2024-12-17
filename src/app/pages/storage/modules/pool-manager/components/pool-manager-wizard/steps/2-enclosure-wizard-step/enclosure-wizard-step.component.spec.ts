import { CdkStepper } from '@angular/cdk/stepper';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of, Subject } from 'rxjs';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { DispersalStrategy, EnclosureWizardStepComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/2-enclosure-wizard-step/enclosure-wizard-step.component';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

describe('EnclosureWizardStepComponent', () => {
  let spectator: Spectator<EnclosureWizardStepComponent>;
  let loader: HarnessLoader;

  const startOver$ = new Subject<void>();

  const createComponent = createComponentFactory({
    component: EnclosureWizardStepComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(CdkStepper),
      mockProvider(PoolManagerStore, {
        startOver$,
        enclosures$: of([{
          label: 'Fake enclosure',
          value: 55,
        }]),
        setEnclosureOptions: jest.fn(),
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

  it('updates store once Maximize group option is selected', () => {
    spectator.component.form.patchValue({
      dispersalStrategy: DispersalStrategy.Maximize,
      limitToEnclosure: null,
    });

    expect(spectator.inject(PoolManagerStore).setEnclosureOptions).toHaveBeenCalledWith({
      limitToSingleEnclosure: null,
      maximizeEnclosureDispersal: true,
      dispersalStrategy: DispersalStrategy.Maximize,
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
      dispersalStrategy: DispersalStrategy.None,
    });
  });

  it('shows Enclosure dropdown once Limit to single group option is selected and updates store', async () => {
    spectator.component.form.patchValue({
      dispersalStrategy: DispersalStrategy.LimitToSingle,
      limitToEnclosure: 'id55',
    });

    const enclosureInput = await loader.getHarness(IxSelectHarness.with({ label: 'Enclosure' }));

    expect(await enclosureInput.getOptionLabels()).toEqual(['Fake enclosure']);

    expect(spectator.inject(PoolManagerStore).setEnclosureOptions).toHaveBeenCalledWith({
      limitToSingleEnclosure: 'id55',
      maximizeEnclosureDispersal: false,
      dispersalStrategy: DispersalStrategy.LimitToSingle,
    });
  });

  it('resets form if Start Over confirmed', () => {
    const form = spectator.component.form;

    form.patchValue({ dispersalStrategy: DispersalStrategy.Maximize, limitToEnclosure: null });

    expect(form.value).toStrictEqual({ dispersalStrategy: DispersalStrategy.Maximize, limitToEnclosure: null });

    const store = spectator.inject(PoolManagerStore);
    store.startOver$.next();

    expect(form.value).toStrictEqual({ dispersalStrategy: DispersalStrategy.None, limitToEnclosure: null });
  });
});
