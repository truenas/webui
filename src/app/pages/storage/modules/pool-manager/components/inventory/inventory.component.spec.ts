import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { InventoryComponent } from 'app/pages/storage/modules/pool-manager/components/inventory/inventory.component';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

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

describe('InventoryComponent', () => {
  let spectator: Spectator<InventoryComponent>;
  const createComponent = createComponentFactory({
    component: InventoryComponent,
    providers: [
      mockProvider(PoolManagerStore, {
        isLoading$: of(false),
        inventory$: of(fakeInventory),
        setManualTopologyCategory: jest.fn(),
        setDiskWarningOptions: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows inventory card by default', () => {
    expect(spectator.query('.card')).toExist();
  });

  it('shows inventory card details when state is loaded', () => {
    expect(spectator.query('.label')).toHaveText('10.91 TiB');
    expect(spectator.query('.value')).toHaveText('× 2');
  });
});
