import { fakeAsync } from '@angular/core/testing';
import { createHostFactory, SpectatorHost } from '@ngneat/spectator/jest';
import { AnimateOutDirective } from './animate-out.directive';

describe('AnimateOutDirective', () => {
  let spectator: SpectatorHost<AnimateOutDirective>;
  const createHost = createHostFactory(AnimateOutDirective);

  it('should trigger animation and emit complete event', fakeAsync(() => {
    const onAnimateOutComplete = jest.fn();

    spectator = createHost(`
      <div
        animateOutClass="fade-out"
        [animateOut]="shouldRemove"
        (animateOutComplete)="onAnimateOutComplete()"
        style="transition: opacity 100ms ease-in-out;"
      >
        Test content
      </div>
    `, {
      hostProps: {
        onAnimateOutComplete,
        shouldRemove: false,
      },
    });

    const element = spectator.element as HTMLElement;

    expect(element).not.toHaveClass('fade-out');

    spectator.setHostInput({ shouldRemove: true });

    expect(element).toHaveClass('fade-out');

    // Manually trigger transitionend event to simulate animation completion
    const transitionEvent = new Event('transitionend');
    element.dispatchEvent(transitionEvent);

    expect(onAnimateOutComplete).toHaveBeenCalled();
  }));
});
