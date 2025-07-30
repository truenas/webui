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

  it('creates an overlay around element and removes it on click', () => {
    const element = document.createElement('div');
    spectator.service.createOverlay(element);

    const overlay = document.body.lastElementChild as HTMLDivElement;
    expect(overlay).toBeTruthy();

    overlay.dispatchEvent(new MouseEvent('click'));
    expect(document.body.contains(overlay)).toBe(false);
  });

  it('cleans up previous highlight when another element selected', () => {
    const element1 = document.createElement('div');
    spectator.service.createOverlay(element1);
    const overlay1 = document.body.lastElementChild as HTMLDivElement;

    expect(document.body.contains(overlay1)).toBe(true);

    const element2 = document.createElement('div');
    spectator.service.createOverlay(element2);
    const overlay2 = document.body.lastElementChild as HTMLDivElement;

    expect(document.body.contains(overlay1)).toBe(false);
    expect(document.body.contains(overlay2)).toBe(true);
  });
});
