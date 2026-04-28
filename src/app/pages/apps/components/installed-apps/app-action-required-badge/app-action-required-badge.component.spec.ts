import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { NavigateAndHighlightService } from 'app/directives/navigate-and-interact/navigate-and-highlight.service';
import { App } from 'app/interfaces/app.interface';
import {
  AppActionRequiredBadgeComponent,
} from 'app/pages/apps/components/installed-apps/app-action-required-badge/app-action-required-badge.component';
import { appNotesCardAnchorId } from 'app/pages/apps/components/installed-apps/app-notes-card/app-notes-card.component';

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

  it('asks NavigateAndHighlightService to highlight the Notes card', () => {
    setupTest({ name: 'app1', action_required: true });
    const navigateAndHighlight = spectator.inject(NavigateAndHighlightService);
    spectator.click('.action-required-badge');

    expect(navigateAndHighlight.waitForElement).toHaveBeenCalledWith(
      appNotesCardAnchorId,
      { block: 'start', inset: true },
    );
  });
});
