import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import {
  WidgetGroupControlsComponent,
} from 'app/pages/dashboard/components/dashboard/widget-group-controls/widget-group-controls.component';

describe('WidgetGroupControlsComponent', () => {
  let spectator: Spectator<WidgetGroupControlsComponent>;
  const createComponent = createComponentFactory({
    component: WidgetGroupControlsComponent,
    shallow: true,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        index: 2,
        totalGroups: 5,
      },
    });
  });

  describe('moving up', () => {
    it('renders a button to move widget up on mobile', () => {
      jest.spyOn(spectator.component.moveUp, 'emit').mockReturnValue();

      const button = spectator.query('[aria-label="Move widget up"]')!;
      expect(button).toExist();
      expect(button.querySelector('ix-icon')).toHaveAttribute('name', 'mdi-menu-up');

      spectator.click(button);

      expect(spectator.component.moveUp.emit).toHaveBeenCalled();
    });

    it('does not render a button to move up when this is the first widget', () => {
      spectator.setInput('index', 0);

      const button = spectator.query('[aria-label="Move widget up"]');
      expect(button).toBeDisabled();
    });
  });

  describe('moving down', () => {
    it('renders a button to move widget down on mobile', () => {
      jest.spyOn(spectator.component.moveDown, 'emit').mockReturnValue();

      const button = spectator.query('[aria-label="Move widget down"]')!;
      expect(button).toExist();
      expect(button.querySelector('ix-icon')).toHaveAttribute('name', 'mdi-menu-down');

      spectator.click(button);

      expect(spectator.component.moveDown.emit).toHaveBeenCalled();
    });

    it('does not render a button to move down when this is the last widget', () => {
      spectator.setInput('index', 4);

      const button = spectator.query('[aria-label="Move widget down"]');
      expect(button).toBeDisabled();
    });
  });

  it('renders a button to edit a widget', () => {
    jest.spyOn(spectator.component.edit, 'emit').mockReturnValue();

    const button = spectator.query('[aria-label="Edit group"]')!;
    expect(button).toExist();
    expect(button.querySelector('ix-icon')).toHaveAttribute('name', 'edit');

    spectator.click(button);

    expect(spectator.component.edit.emit).toHaveBeenCalled();
  });

  it('renders a button to delete a widget', () => {
    jest.spyOn(spectator.component.delete, 'emit').mockReturnValue();

    const button = spectator.query('[aria-label="Delete group"]')!;
    expect(button).toExist();
    expect(button.querySelector('ix-icon')).toHaveAttribute('name', 'mdi-delete');

    spectator.click(button);

    expect(spectator.component.delete.emit).toHaveBeenCalled();
  });
});
