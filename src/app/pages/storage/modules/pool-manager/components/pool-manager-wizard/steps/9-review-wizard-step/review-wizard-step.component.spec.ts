import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import {
  InspectVdevsDialogComponent,
} from 'app/pages/storage/modules/pool-manager/components/inspect-vdevs-dialog/inspect-vdevs-dialog.component';
import {
  ReviewWizardStepComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/9-review-wizard-step/review-wizard-step.component';
import { PoolManagerStore, PoolManagerTopology } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

describe('ReviewWizardStepComponent', () => {
  let spectator: Spectator<ReviewWizardStepComponent>;
  let loader: HarnessLoader;
  const topology = {} as PoolManagerTopology;

  const createComponent = createComponentFactory({
    component: ReviewWizardStepComponent,
    providers: [
      mockProvider(PoolManagerStore, {
        topology$: of(topology),
      }),
      mockProvider(MatDialog),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('emits (createPool) when Create Pool is pressed', async () => {
    jest.spyOn(spectator.component.createPool, 'emit');

    const createPool = await loader.getHarness(MatButtonHarness.with({ text: 'Create Pool' }));
    await createPool.click();

    expect(spectator.component.createPool.emit).toHaveBeenCalled();
  });

  it('opens an Inspect Vdevs dialog when corresponding button is pressed', async () => {
    const inspectButton = await loader.getHarness(MatButtonHarness.with({ text: 'Inspect VDEVs' }));
    await inspectButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(InspectVdevsDialogComponent, {
      data: topology,
    });
  });
});
