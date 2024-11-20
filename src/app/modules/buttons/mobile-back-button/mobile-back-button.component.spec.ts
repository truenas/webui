import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { MobileBackButtonComponent } from './mobile-back-button.component';

describe('MobileBackButtonComponent', () => {
  let spectator: Spectator<MobileBackButtonComponent>;
  const createComponent = createComponentFactory({
    component: MobileBackButtonComponent,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should render a button with the correct classes and attributes', () => {
    const button = spectator.query('.mobile-back-button');
    expect(button).toBeTruthy();
    expect(button).toHaveAttribute('tabindex', '0');
    expect(button).toHaveAttribute('aria-label', 'Back');
  });

  it('should emit onClose when the button is clicked', () => {
    const onCloseSpy = jest.spyOn(spectator.component.onClose, 'emit');
    spectator.click('.mobile-back-button');
    expect(onCloseSpy).toHaveBeenCalled();
  });

  it('should emit onClose when the Enter key is pressed', () => {
    const onCloseSpy = jest.spyOn(spectator.component.onClose, 'emit');
    spectator.dispatchKeyboardEvent('.mobile-back-button', 'keydown', 'Enter');
    expect(onCloseSpy).toHaveBeenCalled();
  });
});
