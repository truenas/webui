import { CdkStepper } from '@angular/cdk/stepper';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { mockProvider, Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { CreateVdevLayout, VDevType } from 'app/enums/v-dev-type.enum';
import { helptextPoolCreation } from 'app/helptext/storage/volumes/pool-creation/pool-creation';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { LayoutStepComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/layout-step.component';
import { SpareWizardStepComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/5-spare-wizard-step/spare-wizard-step.component';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

describe('SpareWizardStepComponent', () => {
  let spectator: Spectator<SpareWizardStepComponent>;
  let loader: HarnessLoader;

  const fakeInventory = [
    {
      identifier: '{serial_lunid}8HG7MZJH_5000cca2700de678',
      name: 'sdo',
      devname: 'sdo',
      serial: '8HG7MZJH',
      size: 12000138625024,
      type: 'HDD',
    } as DetailsDisk,
    {
      identifier: '{serial_lunid}8DJ61EBH_5000cca2537bba6c',
      name: 'sdv',
      devname: 'sdv',
      serial: '8DJ61EBH',
      size: 12000138625024,
      type: 'HDD',
    } as DetailsDisk,
  ];

  const createComponent = createComponentFactory({
    component: SpareWizardStepComponent,
    declarations: [
      MockComponent(LayoutStepComponent),
    ],
    providers: [
      mockProvider(CdkStepper),
      mockProvider(PoolManagerStore, {
        getInventoryForStep: jest.fn(() => of(fakeInventory)),
        resetStep: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('has the correct inputs', () => {
    const layoutComponent = spectator.query(LayoutStepComponent)!;
    expect(layoutComponent.description).toBe(helptextPoolCreation.spareVdevDescription);
    expect(layoutComponent.canChangeLayout).toBeFalsy();
    expect(layoutComponent.inventory).toStrictEqual([...fakeInventory]);
    expect(layoutComponent.limitLayouts).toStrictEqual([CreateVdevLayout.Stripe]);
    expect(layoutComponent.type).toStrictEqual(VDevType.Spare);
  });

  it('resets step when Reset Step button is clicked', async () => {
    const resetButton = await loader.getHarness(MatButtonHarness.with({ text: 'Reset Step' }));
    await resetButton.click();
    expect(spectator.inject(PoolManagerStore).resetStep).toHaveBeenCalledWith(VDevType.Spare);
  });

  it('emits goToLastStep when Save And Go To Review button is clicked', async () => {
    jest.spyOn(spectator.component.goToLastStep, 'emit');
    const reviewButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save And Go To Review' }));
    await reviewButton.click();
    expect(spectator.component.goToLastStep.emit).toHaveBeenCalled();
  });
});
