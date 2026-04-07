import { fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import {
  createServiceFactory,
  SpectatorService,
} from '@ngneat/spectator/jest';
import { MockProvider } from 'ng-mocks';
import { NavigateAndHighlightService } from 'app/directives/navigate-and-interact/navigate-and-highlight.service';

describe('NavigateAndInteractService', () => {
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
});
