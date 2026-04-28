import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { NavigateAndHighlightService } from 'app/directives/navigate-and-interact/navigate-and-highlight.service';
import { App } from 'app/interfaces/app.interface';
import {
  AppActionRequiredBadgeComponent,
} from 'app/pages/apps/components/installed-apps/app-action-required-badge/app-action-required-badge.component';
import { appNotesCardAnchorId } from 'app/pages/apps/components/installed-apps/installed-apps.constants';

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
    setupTest({ name: 'app1', action_required: false, notes: 'do something' });
    expect(spectator.query('.action-required-badge')).toBeNull();
  });

  it('renders nothing when notes are empty even if action_required is true', () => {
    setupTest({ name: 'app1', action_required: true, notes: '' });
    expect(spectator.query('.action-required-badge')).toBeNull();
  });

  it('does not call NavigateAndHighlightService when action_required is false', () => {
    setupTest({ name: 'app1', action_required: false, notes: 'do something' });
    expect(spectator.inject(NavigateAndHighlightService).waitForElement).not.toHaveBeenCalled();
  });

  it('renders an alert icon button when action_required is true and notes are present', () => {
    setupTest({ name: 'app1', action_required: true, notes: 'do something' });
    expect(spectator.query('.action-required-badge')).toExist();
    expect(spectator.query('.action-required-badge tn-icon')).toExist();
  });

  it('asks NavigateAndHighlightService to highlight the Notes card on click', () => {
    setupTest({ name: 'app1', action_required: true, notes: 'do something' });
    const navigateAndHighlight = spectator.inject(NavigateAndHighlightService);
    spectator.click('.action-required-badge');

    expect(navigateAndHighlight.waitForElement).toHaveBeenCalledWith(
      appNotesCardAnchorId,
      { block: 'start', inset: true },
    );
  });
});
