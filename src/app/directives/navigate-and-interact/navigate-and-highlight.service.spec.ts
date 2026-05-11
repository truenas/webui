import { fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import {
  createServiceFactory,
  SpectatorService,
} from '@ngneat/spectator/jest';
import { MockProvider } from 'ng-mocks';
import { NavigateAndHighlightService } from 'app/directives/navigate-and-interact/navigate-and-highlight.service';

describe('NavigateAndHighlightService', () => {
  let spectator: SpectatorService<NavigateAndHighlightService>;
  const createComponent = createServiceFactory({
    service: NavigateAndHighlightService,
    providers: [
      MockProvider(Router, {
        navigate: jest.fn(() => Promise.resolve(true)),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should call router.navigate with correct parameters on click', () => {
    spectator.service.navigateAndHighlight(['/some-path'], 'testHash');
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/some-path'], { fragment: 'testHash' });
  });

  it('should scroll to and highlight the element with the given ID', fakeAsync(() => {
    const scrollIntoViewMock = jest.fn();

    const element = document.createElement('div');
    element.id = 'testHash';
    element.scrollIntoView = scrollIntoViewMock;
    document.body.appendChild(element);

    spectator.service.navigateAndHighlight(['/some-path'], 'testHash');

    tick(150);

    expect(scrollIntoViewMock).toHaveBeenCalled();
  }));

  it('highlights element with outline and removes it on click', () => {
    const element = document.createElement('div');
    spectator.service.highlight(element);

    expect(element.style.outline).toBe('2px solid var(--primary)');

    element.dispatchEvent(new MouseEvent('click'));
    expect(element.style.outline).toBe('');
  });

  it('cleans up previous highlight when another element is highlighted', () => {
    const element1 = document.createElement('div');
    spectator.service.highlight(element1);

    expect(element1.style.outline).toBe('2px solid var(--primary)');

    const element2 = document.createElement('div');
    spectator.service.highlight(element2);

    expect(element1.style.outline).toBe('');
    expect(element2.style.outline).toBe('2px solid var(--primary)');
  });

  it('cancels an in-flight poll when waitForElement is called again', fakeAsync(() => {
    const firstScrollSpy = jest.fn();
    const secondScrollSpy = jest.fn();

    const firstElement = document.createElement('div');
    firstElement.id = 'first-poll-target';
    firstElement.scrollIntoView = firstScrollSpy;

    const secondElement = document.createElement('div');
    secondElement.id = 'second-poll-target';
    secondElement.scrollIntoView = secondScrollSpy;

    spectator.service.waitForElement('first-poll-target');
    // Second call before either element is in the DOM should cancel the first poll.
    spectator.service.waitForElement('second-poll-target');

    document.body.appendChild(firstElement);
    document.body.appendChild(secondElement);

    tick(150);

    expect(firstScrollSpy).not.toHaveBeenCalled();
    expect(secondScrollSpy).toHaveBeenCalledTimes(1);

    // Run past further poll intervals to confirm the cancelled poll never fires.
    tick(500);
    expect(firstScrollSpy).not.toHaveBeenCalled();
    expect(secondScrollSpy).toHaveBeenCalledTimes(1);

    document.body.removeChild(firstElement);
    document.body.removeChild(secondElement);
  }));
});
