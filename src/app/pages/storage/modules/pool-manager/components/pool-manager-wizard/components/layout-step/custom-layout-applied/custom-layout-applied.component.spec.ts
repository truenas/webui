import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Subject } from 'rxjs';
import { VdevType } from 'app/enums/v-dev-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import {
  CustomLayoutAppliedComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/custom-layout-applied/custom-layout-applied.component';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

describe('CustomLayoutAppliedComponent', () => {
  let spectator: Spectator<CustomLayoutAppliedComponent>;
  let loader: HarnessLoader;
  const resetStep$ = new Subject<VdevType>();

  const createComponent = createComponentFactory({
    component: CustomLayoutAppliedComponent,
    providers: [
      mockProvider(PoolManagerStore, {
        resetStep$,
        resetTopologyCategory: jest.fn(),
        openManualSelectionDialog: jest.fn(),
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
        ] as DetailsDisk[][],
      },
    });

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows vdevs length', () => {
    expect(spectator.query('.vdevs-length')).toHaveText('VDEVs: 2');
  });

  it('calls store.openManualSelectionDialog when button clicked', async () => {
    const editButton = await loader.getHarness(
      MatButtonHarness.with({ text: 'Edit Manual Disk Selection' }),
    );

    await editButton.click();

    expect(spectator.inject(PoolManagerStore).openManualSelectionDialog).toHaveBeenCalled();
  });
});
