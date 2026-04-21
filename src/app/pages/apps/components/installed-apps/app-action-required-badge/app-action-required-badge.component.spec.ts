import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { App } from 'app/interfaces/app.interface';
import { AppActionRequiredBadgeComponent } from 'app/pages/apps/components/installed-apps/app-action-required-badge/app-action-required-badge.component';

describe('AppActionRequiredBadgeComponent', () => {
  let spectator: Spectator<AppActionRequiredBadgeComponent>;

  const createComponent = createComponentFactory({
    component: AppActionRequiredBadgeComponent,
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

  it('renders the badge when action_required is true', () => {
    setupTest({ name: 'app1', action_required: true });
    expect(spectator.query('.action-required-badge')).toExist();
  });
});
