import { stopRowActivationKeys } from 'app/modules/tn-table-cells/stop-row-activation-keys';

describe('stopRowActivationKeys', () => {
  const keydown = (key: string): KeyboardEvent => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    jest.spyOn(event, 'stopPropagation');
    return event;
  };

  it.each(['Enter', ' '])('stops %p from reaching the row handler', (key) => {
    const event = keydown(key);

    stopRowActivationKeys(event);

    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it.each(['Escape', 'ArrowDown', 'Tab', 'a'])('lets %p through to the table', (key) => {
    const event = keydown(key);

    stopRowActivationKeys(event);

    expect(event.stopPropagation).not.toHaveBeenCalled();
  });
});
