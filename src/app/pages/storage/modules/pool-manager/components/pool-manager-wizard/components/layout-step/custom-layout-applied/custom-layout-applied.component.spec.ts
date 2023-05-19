import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { VdevType } from 'app/enums/v-dev-type.enum';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import {
  CustomLayoutAppliedComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/custom-layout-applied/custom-layout-applied.component';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

describe('CustomLayoutAppliedComponent', () => {
  let spectator: Spectator<CustomLayoutAppliedComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: CustomLayoutAppliedComponent,
    providers: [
      mockProvider(PoolManagerStore, {
        resetTopologyCategory: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        type: VdevType.Data,
        vdevs: [
          [{}],
          [{}],
        ] as UnusedDisk[][],
      },
    });

    jest.spyOn(spectator.component.manualSelectionClicked, 'emit');
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows vdevs length', () => {
    expect(spectator.query('.vdevs-length')).toHaveText('VDEVs: 2');
  });

  it('emits manualSelectionClicked when Edit button is pressed', async () => {
    const editButton = await loader.getHarness(
      MatButtonHarness.with({ text: 'Edit Manual Disk Selection' }),
    );

    await editButton.click();

    expect(spectator.component.manualSelectionClicked.emit).toHaveBeenCalled();
  });

  it('calls resetTopologyCategory when Reset button is pressed', async () => {
    const resetButton = await loader.getHarness(MatButtonHarness.with({ text: 'Reset' }));
    await resetButton.click();

    expect(spectator.inject(PoolManagerStore).resetTopologyCategory).toHaveBeenCalledWith(VdevType.Data);
  });
});
