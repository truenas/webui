import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnRadioHarness, TnSelectHarness, TnStepperComponent } from '@truenas/ui-components';
import { of, Subject } from 'rxjs';
import { Enclosure } from 'app/interfaces/enclosure.interface';
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
      mockProvider(TnStepperComponent),
      mockProvider(PoolManagerStore, {
        startOver$,
        enclosures$: of([{
          label: 'Fake enclosure',
          id: 'id55',
        } as Enclosure]),
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
    const limitRadio = await loader.getHarness(
      TnRadioHarness.with({ label: 'Limit Pool To A Single Enclosure' }),
    );
    await limitRadio.check();

    const enclosureInput = await loader.getHarness(
      TnSelectHarness.with({ selector: '[formControlName="limitToEnclosure"]' }),
    );

    expect(await enclosureInput.getOptions()).toEqual(['Fake enclosure']);
    await enclosureInput.selectOption('Fake enclosure');

    expect(spectator.inject(PoolManagerStore).setEnclosureOptions).toHaveBeenCalledWith({
      limitToSingleEnclosure: 'id55',
      maximizeEnclosureDispersal: false,
      dispersalStrategy: DispersalStrategy.LimitToSingle,
    });
  });

  it('resets form if Start Over confirmed', async () => {
    const form = spectator.component.form;

    // Picked through the UI rather than patched: only a user-originated change leaves the other
    // radios' `checked` state stale, which is what the reset has to recover from.
    const maximizeRadio = await loader.getHarness(
      TnRadioHarness.with({ label: 'Maximize Enclosure Dispersal' }),
    );
    await maximizeRadio.check();

    expect(form.value).toStrictEqual({ dispersalStrategy: DispersalStrategy.Maximize, limitToEnclosure: null });

    const store = spectator.inject(PoolManagerStore);
    store.startOver$.next();
    spectator.detectChanges();

    expect(form.value).toStrictEqual({ dispersalStrategy: DispersalStrategy.None, limitToEnclosure: null });

    const noneRadio = await loader.getHarness(
      TnRadioHarness.with({ label: 'No Enclosure Dispersal Strategy' }),
    );
    expect(await noneRadio.isChecked()).toBe(true);
    expect(await maximizeRadio.isChecked()).toBe(false);
  });
});
