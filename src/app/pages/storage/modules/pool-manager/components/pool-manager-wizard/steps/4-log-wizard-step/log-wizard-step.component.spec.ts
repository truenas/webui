import { CdkStepper } from '@angular/cdk/stepper';
import { mockProvider, Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import { helptextManager } from 'app/helptext/storage/volumes/manager/manager';
import { AddVdevsStore } from 'app/pages/storage/modules/pool-manager/components/add-vdevs/store/add-vdevs-store.service';
import { LayoutStepComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/layout-step.component';
import { LogWizardStepComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/4-log-wizard-step/log-wizard-step.component';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

describe('LogWizardStepComponent', () => {
  let spectator: Spectator<LogWizardStepComponent>;

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
    component: LogWizardStepComponent,
    declarations: [
      MockComponent(LayoutStepComponent),
    ],
    providers: [
      mockProvider(CdkStepper),
      mockProvider(PoolManagerStore, {
        getInventoryForStep: jest.fn(() => of(fakeInventory)),
      }),
      mockProvider(AddVdevsStore, {
        pool$: of(null),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('has the correct inputs', () => {
    const layoutComponent = spectator.query(LayoutStepComponent);
    expect(layoutComponent.description).toBe(helptextManager.log_vdev_description);
    expect(layoutComponent.canChangeLayout).toBeTruthy();
    expect(layoutComponent.inventory).toStrictEqual([...fakeInventory]);
    expect(layoutComponent.limitLayouts).toStrictEqual([CreateVdevLayout.Mirror, CreateVdevLayout.Stripe]);
    expect(layoutComponent.type).toStrictEqual(VdevType.Log);
  });
});
