import { createDirectiveFactory, mockProvider, SpectatorDirective } from '@ngneat/spectator/jest';
import { NavigateAndInteractService } from 'app/directives/navigate-and-interact/navigate-and-interact.service';
import { NavigateAndInteractDirective } from './navigate-and-interact.directive';

describe('NavigateAndInteractDirective', () => {
  let spectator: SpectatorDirective<NavigateAndInteractDirective>;
  const createDirective = createDirectiveFactory({
    directive: NavigateAndInteractDirective,
    providers: [
      mockProvider(NavigateAndInteractService),
    ],
  });

  beforeEach(() => {
    spectator = createDirective('<div ixNavigateAndInteract [navigateRoute]="[\'/some-path\']" navigateHash="testHash"></div>');
  });

  it('calls NavigateAndInteractService.navigateAndInteract when element is clicked', () => {
    spectator.dispatchMouseEvent(spectator.element, 'click');
    expect(spectator.inject(NavigateAndInteractService).navigateAndInteract).toHaveBeenCalledWith(['/some-path'], 'testHash');
  });
});
