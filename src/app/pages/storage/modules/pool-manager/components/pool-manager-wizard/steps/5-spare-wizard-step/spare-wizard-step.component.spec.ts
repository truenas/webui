import { CdkStepper } from '@angular/cdk/stepper';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { mockProvider, Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of, Subject } from 'rxjs';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import { helptextManager } from 'app/helptext/storage/volumes/manager/manager';
import { IxComboboxHarness } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.harness';
import { LayoutStepComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/layout-step.component';
import { SpareWizardStepComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/5-spare-wizard-step/spare-wizard-step.component';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

describe('SpareWizardStepComponent', () => {
  let spectator: Spectator<SpareWizardStepComponent>;
  let loader: HarnessLoader;
  const resetStep$ = new Subject<VdevType>();
  const startOver$ = new Subject<void>();

  const fakeInventory = [
    {
      identifier: '{serial_lunid}8HG7MZJH_5000cca2700de678',
      name: 'sdo',
      number: 2272,
      serial: '8HG7MZJH',
      size: 12000138625024,
      type: 'HDD',
    },
    {
      identifier: '{serial_lunid}8DJ61EBH_5000cca2537bba6c',
      name: 'sdv',
      number: 16720,
      serial: '8DJ61EBH',
      size: 12000138625024,
      type: 'HDD',
    },
  ];

  const createComponent = createComponentFactory({
    component: SpareWizardStepComponent,
    imports: [
      ReactiveFormsModule,
    ],
    declarations: [
      MockComponent(LayoutStepComponent),
    ],
    providers: [
      mockProvider(CdkStepper),
      mockProvider(PoolManagerStore, {
        getInventoryForStep: jest.fn(() => of(fakeInventory)),
        startOver$,
        resetStep$,
        setManualTopologyCategory: jest.fn(),
        setAutomaticTopologyCategory: jest.fn(),
        setTopologyCategoryLayout: jest.fn(),
        resetStep: jest.fn(() => resetStep$.next(VdevType.Spare)),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('has correct description', () => {
    const descriptionEl = spectator.query('div');
    expect(descriptionEl.textContent).toBe(` ${helptextManager.spare_vdev_description}\n`);
  });

  it('shows disk options for spare', async () => {
    const ixCombobox = await loader.getHarness(IxComboboxHarness.with({ label: 'Select Disk for Spare VDEV' }));
    await ixCombobox.focusInput();
    const options = await ixCombobox.getAutocompleteOptions();
    expect(options).toEqual([
      'sdo - HDD (10.91 TiB)',
      'sdv - HDD (10.91 TiB)',
    ]);
  });

  it('sets store state when option changed', async () => {
    const ixCombobox = await loader.getHarness(IxComboboxHarness.with({ label: 'Select Disk for Spare VDEV' }));
    await ixCombobox.setValue('sdo - HDD (10.91 TiB)');
    expect(
      spectator.inject(PoolManagerStore).setTopologyCategoryLayout,
    ).toHaveBeenCalledWith(VdevType.Spare, CreateVdevLayout.Stripe);

    expect(spectator.inject(PoolManagerStore).setManualTopologyCategory).toHaveBeenCalledWith(
      VdevType.Spare,
      [[fakeInventory[0]]],
    );

    expect(spectator.inject(PoolManagerStore).setAutomaticTopologyCategory).toHaveBeenCalledWith(
      VdevType.Spare,
      {
        diskSize: fakeInventory[0].size,
        diskType: fakeInventory[0].type,
        layout: CreateVdevLayout.Stripe,
        vdevsNumber: 1,
        width: 1,
      },
    );
  });

  it('handles reset events', async () => {
    const ixCombobox = await loader.getHarness(IxComboboxHarness.with({ label: 'Select Disk for Spare VDEV' }));
    await ixCombobox.setValue('sdo - HDD (10.91 TiB)');
    const resetButton = await loader.getHarness(MatButtonHarness.with({ text: 'Reset Step' }));
    await resetButton.click();
    expect(spectator.inject(PoolManagerStore).resetStep).toHaveBeenCalledWith(VdevType.Spare);
    expect(await ixCombobox.getValue()).toBe('');
  });

  it('resets when form is reset', async () => {
    const ixCombobox = await loader.getHarness(IxComboboxHarness.with({ label: 'Select Disk for Spare VDEV' }));
    await ixCombobox.setValue('sdo - HDD (10.91 TiB)');
    startOver$.next();
    expect(await ixCombobox.getValue()).toBe('');
  });

  it('emits review button is clicked', async () => {
    const button = await loader.getHarness(MatButtonHarness.with({ text: 'Save And Go To Review' }));
    jest.spyOn(spectator.component.goToLastStep, 'emit');
    await button.click();
    expect(spectator.component.goToLastStep.emit).toHaveBeenCalled();
  });
});
