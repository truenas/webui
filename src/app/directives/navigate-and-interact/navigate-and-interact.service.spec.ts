import { Router } from '@angular/router';
import {
  createServiceFactory,
  SpectatorService,
} from '@ngneat/spectator/jest';
import { MockProvider } from 'ng-mocks';
import { NavigateAndInteractService } from 'app/directives/navigate-and-interact/navigate-and-interact.service';

describe('NavigateAndInteractService', () => {
  let spectator: SpectatorService<NavigateAndInteractService>;
  const createComponent = createServiceFactory({
    service: NavigateAndInteractService,
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
    spectator.service.navigateAndInteract(['/some-path'], 'testHash');
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/some-path'], { fragment: 'testHash' });
  });

  it('should scroll to and highlight the element with the given ID', () => {
    const scrollIntoViewMock = jest.fn();
    HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    const mockElement = document.createElement('div');
    mockElement.id = 'testHash';
    document.body.appendChild(mockElement);

    const clickSpy = jest.spyOn(HTMLElement.prototype, 'click');

    spectator.service.navigateAndInteract(['/some-path'], 'testHash');

    setTimeout(() => {
      expect(scrollIntoViewMock).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();

      // Clean up
      document.body.removeChild(mockElement);
      // Restore original scrollIntoView
      delete HTMLElement.prototype.scrollIntoView;
    }, 0);
  });
});
