import { signal } from '@angular/core';
import { createHostFactory, SpectatorHost } from '@ngneat/spectator/jest';
import { AnimateOutDirective } from './animate-out.directive';

describe('AnimateOutDirective', () => {
  let spectator: SpectatorHost<AnimateOutDirective>;
  const createHost = createHostFactory(AnimateOutDirective);

  it('should trigger animation and emit complete event', () => {
    const onAnimateOutComplete = jest.fn();
    // A signal rather than a plain host prop: zoneless change detection does not refresh the host
    // when spectator.setHostInput() assigns a plain field.
    const shouldRemove = signal(false);

    spectator = createHost(`
      <div
        animateOutClass="fade-out"
        [animateOut]="shouldRemove()"
        (animateOutComplete)="onAnimateOutComplete()"
        style="transition: opacity 100ms ease-in-out;"
      >
        Test content
      </div>
    `, {
      hostProps: {
        onAnimateOutComplete,
        shouldRemove,
      },
    });

    const element = spectator.element as HTMLElement;

    expect(element).not.toHaveClass('fade-out');

    shouldRemove.set(true);
    spectator.detectChanges();

    expect(element).toHaveClass('fade-out');

    // Manually trigger transitionend event to simulate animation completion
    const transitionEvent = new Event('transitionend');
    element.dispatchEvent(transitionEvent);

    expect(onAnimateOutComplete).toHaveBeenCalled();
  });
});
