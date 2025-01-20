import { createDirectiveFactory, mockProvider, SpectatorDirective } from '@ngneat/spectator/jest';
import { NavigateAndHighlightDirective } from 'app/directives/navigate-and-interact/navigate-and-highlight.directive';
import { NavigateAndHighlightService } from 'app/directives/navigate-and-interact/navigate-and-highlight.service';

describe('NavigateAndInteractDirective', () => {
  let spectator: SpectatorDirective<NavigateAndHighlightDirective>;
  const createDirective = createDirectiveFactory({
    directive: NavigateAndHighlightDirective,
    providers: [
      mockProvider(NavigateAndHighlightService),
    ],
  });

  beforeEach(() => {
    spectator = createDirective('<div ixNavigateAndHighlight [navigateRoute]="[\'/some-path\']" navigateHash="testHash"></div>');
  });

  it('calls NavigateAndInteractService.navigateAndInteract when element is clicked', () => {
    spectator.dispatchMouseEvent(spectator.element, 'click');
    expect(spectator.inject(NavigateAndHighlightService).navigateAndHighlight).toHaveBeenCalledWith(['/some-path'], 'testHash');
  });
});
