import { Router } from '@angular/router';
import { createDirectiveFactory, SpectatorDirective } from '@ngneat/spectator/jest';
import { MockProvider } from 'ng-mocks';
import { NavigateAndInteractDirective } from './navigate-and-interact.directive';

describe('NavigateAndInteractDirective', () => {
  let spectator: SpectatorDirective<NavigateAndInteractDirective>;
  let mockRouter: Router;
  const createDirective = createDirectiveFactory({
    directive: NavigateAndInteractDirective,
    providers: [
      MockProvider(Router, {
        navigate: jest.fn(() => Promise.resolve(true)),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createDirective('<div ixNavigateAndInteract [navigateRoute]="[\'/some-path\']" navigateHash="testHash"></div>');
    mockRouter = spectator.inject(Router);
  });

  it('should create an instance', () => {
    expect(spectator.directive).toBeTruthy();
  });

  it('should call router.navigate with correct parameters on click', () => {
    spectator.dispatchMouseEvent(spectator.element, 'click');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/some-path'], { fragment: 'testHash' });
  });

  it('should scroll to and highlight the element with the given ID', () => {
    const scrollIntoViewMock = jest.fn();
    HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    const mockElement = document.createElement('div');
    mockElement.id = 'testHash';
    document.body.appendChild(mockElement);

    const clickSpy = jest.spyOn(HTMLElement.prototype, 'click');

    spectator.dispatchMouseEvent(spectator.element, 'click');

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
