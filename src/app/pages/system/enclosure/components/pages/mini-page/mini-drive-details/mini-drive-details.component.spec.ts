import { signal } from '@angular/core';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import {
  MiniDriveDetailsComponent,
} from 'app/pages/system/enclosure/components/pages/mini-page/mini-drive-details/mini-drive-details.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { getItemValueFactory } from 'app/pages/system/enclosure/utils/get-item-value-factory.utils';

describe('MiniDriveDetailsComponent', () => {
  let spectator: Spectator<MiniDriveDetailsComponent>;
  const slot = {
    model: 'A3',
    rotationrate: 7200,
    serial: '12345',
    pool_info: {
      pool_name: 'pool1',
    },
  } as DashboardEnclosureSlot;

  const selectedSlotSignal = signal(slot);
  let getItemValue: (name: string) => string;

  const createComponent = createComponentFactory({
    component: MiniDriveDetailsComponent,
    providers: [
      mockProvider(EnclosureStore, {
        selectedSlot: selectedSlotSignal,
        selectSlot: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    selectedSlotSignal.set(slot);
    getItemValue = getItemValueFactory(spectator);
  });

  it('shows pool for the selected slot', () => {
    expect(getItemValue('Pool:')).toMatch('pool1');
  });

  it('shows disk model', () => {
    expect(getItemValue('Model:')).toBe('A3');
  });

  it('shows disk serial', () => {
    expect(getItemValue('Serial:')).toMatch('12345');
  });

  it('shows disk rotation rate', () => {
    expect(getItemValue('Rotation Rate:')).toMatch('7200 RPM');
  });

  it('unselects a slot when X is pressed', () => {
    spectator.click('ix-icon');

    expect(spectator.inject(EnclosureStore).selectSlot).toHaveBeenCalledWith(null);
  });

  // TODO: Test case for VDEV

  it('shows "Disk not attached to any pools" when this is the case', () => {
    selectedSlotSignal.set({
      pool_info: null,
    } as DashboardEnclosureSlot);
    spectator.detectChanges();

    expect(getItemValue('Pool:')).toMatch('Disk not attached to any pools.');
  });
});
