import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { NavigateAndHighlightService } from 'app/directives/navigate-and-interact/navigate-and-highlight.service';
import { App } from 'app/interfaces/app.interface';
import {
  AppActionRequiredBadgeComponent,
  appNotesCardAnchorId,
} from 'app/pages/apps/components/installed-apps/app-action-required-badge/app-action-required-badge.component';
import { focusNotesEvent } from 'app/pages/apps/components/installed-apps/app-notes-card/app-notes-card.component';

describe('AppActionRequiredBadgeComponent', () => {
  let spectator: Spectator<AppActionRequiredBadgeComponent>;

  const createComponent = createComponentFactory({
    component: AppActionRequiredBadgeComponent,
    providers: [
      mockProvider(NavigateAndHighlightService),
    ],
  });

  function setupTest(app: Partial<App>): void {
    spectator = createComponent({
      props: { app: app as App },
    });
  }

  it('renders nothing when action_required is false', () => {
    setupTest({ name: 'app1', action_required: false });
    expect(spectator.query('.action-required-badge')).toBeNull();
  });

  it('renders an alert icon button when action_required is true', () => {
    setupTest({ name: 'app1', action_required: true });
    expect(spectator.query('.action-required-badge')).toExist();
    expect(spectator.query('.action-required-badge tn-icon')).toExist();
  });

  it('asks NavigateAndHighlightService to highlight the Notes card and dispatches a focus-notes event', () => {
    setupTest({ name: 'app1', action_required: true });
    const navigateAndHighlight = spectator.inject(NavigateAndHighlightService);
    spectator.click('.action-required-badge');

    expect(navigateAndHighlight.waitForElement).toHaveBeenCalledWith(
      appNotesCardAnchorId,
      expect.objectContaining({ block: 'start', onFound: expect.any(Function) }),
    );

    const options = jest.mocked(navigateAndHighlight.waitForElement).mock.calls[0][1]!;
    const element = document.createElement('div');
    const dispatchSpy = jest.spyOn(element, 'dispatchEvent');
    options.onFound!(element);

    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
    expect(dispatchSpy.mock.calls[0][0].type).toBe(focusNotesEvent);
  });
});
