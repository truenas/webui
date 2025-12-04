import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { InventoryComponent } from 'app/pages/storage/modules/pool-manager/components/inventory/inventory.component';
import { EncryptionType } from 'app/pages/storage/modules/pool-manager/enums/encryption-type.enum';
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
        encryptionType$: of(EncryptionType.None),
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

  it('does not show SED badge when encryption is None', () => {
    const badge = spectator.query('.sed-badge');
    expect(badge).toBeFalsy();
  });
});

describe('InventoryComponent with SED encryption', () => {
  let spectator: Spectator<InventoryComponent>;
  const createComponent = createComponentFactory({
    component: InventoryComponent,
    providers: [
      mockProvider(PoolManagerStore, {
        isLoading$: of(false),
        inventory$: of(fakeInventory),
        encryptionType$: of(EncryptionType.Sed),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows SED badge when SED encryption is selected', () => {
    const badge = spectator.query('.sed-badge');
    expect(badge).toBeTruthy();
    expect(badge).toHaveText('SED');
  });
});

describe('InventoryComponent with Software encryption', () => {
  let spectator: Spectator<InventoryComponent>;
  const createComponent = createComponentFactory({
    component: InventoryComponent,
    providers: [
      mockProvider(PoolManagerStore, {
        isLoading$: of(false),
        inventory$: of(fakeInventory),
        encryptionType$: of(EncryptionType.Software),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('does not show SED badge when encryption is Software', () => {
    const badge = spectator.query('.sed-badge');
    expect(badge).toBeFalsy();
  });
});
