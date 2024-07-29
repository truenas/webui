import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import {
  NotSupportedModelComponent,
} from 'app/pages/system/enclosure/components/enclosure-side/not-supported-model/not-supported-model.component';

describe('NotSupportedModelComponent', () => {
  let spectator: Spectator<NotSupportedModelComponent>;
  const createComponent = createComponentFactory({
    component: NotSupportedModelComponent,
  });

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation();

    spectator = createComponent({
      props: {
        model: 'F777',
        slots: [
          { drive_bay_number: 1 },
          { drive_bay_number: 2 },
          { drive_bay_number: 3 },
        ] as DashboardEnclosureSlot[],
        enableMouseEvents: true,
        slotTintFn: () => 'red',
      },
    });
  });

  it('logs an error with the name of unsupported model', () => {
    expect(console.error).toHaveBeenCalledWith('Unsupported enclosure model: F777');
  });

  it('renders slots and their numbers', () => {
    const slots = spectator.queryAll('.slot');
    expect(slots).toHaveLength(3);
    expect(slots[0]).toHaveText('1');
    expect(slots[1]).toHaveText('2');
    expect(slots[2]).toHaveText('3');
  });

  it('uses slotTintFn to set background color on a slot', () => {
    const tintFunction = jest.fn(() => 'blue');
    spectator.setInput('slotTintFn', tintFunction);

    expect(tintFunction).toHaveBeenNthCalledWith(1, { drive_bay_number: 1 });
    expect(tintFunction).toHaveBeenNthCalledWith(2, { drive_bay_number: 2 });
    expect(tintFunction).toHaveBeenNthCalledWith(3, { drive_bay_number: 3 });

    const slot = spectator.query('.slot .background');
    expect(slot).toHaveStyle({ backgroundColor: 'blue' });
  });

  it('adds high-count class when number of slots is more than 60', () => {
    spectator.setInput('slots', Array.from({ length: 61 }, (_, i) => ({ drive_bay_number: i + 1 })));

    const slots = spectator.query('.slots');
    expect(slots).toHaveClass('high-count');
  });

  it('adds selected class for selected slot', () => {
    spectator.setInput('selectedSlot', { drive_bay_number: 2 });

    const slot = spectator.query('.slot:nth-child(2)');
    expect(slot).toHaveClass('selected');
  });

  it('adds static class when mouse events are disabled', () => {
    spectator.setInput('enableMouseEvents', false);

    const slot = spectator.query('.slot');
    expect(slot).toHaveClass('static');
  });

  it('updates selectedSlot model when user clicks on the slot', () => {
    jest.spyOn(spectator.component.selectedSlot, 'set');
    spectator.click('.slot');

    expect(spectator.component.selectedSlot.set).toHaveBeenCalledWith({ drive_bay_number: 1 });
  });
});
