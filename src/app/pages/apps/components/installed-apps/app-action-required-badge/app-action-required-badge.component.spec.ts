import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { WINDOW } from 'app/helpers/window.helper';
import { App } from 'app/interfaces/app.interface';
import { AppActionRequiredBadgeComponent } from 'app/pages/apps/components/installed-apps/app-action-required-badge/app-action-required-badge.component';

describe('AppActionRequiredBadgeComponent', () => {
  let spectator: Spectator<AppActionRequiredBadgeComponent>;
  const scrollIntoView = jest.fn();
  const getElementById = jest.fn().mockReturnValue({ scrollIntoView });
  const setTimeoutSpy = jest.fn((cb: () => void) => {
    cb();
    return 0;
  });

  const createComponent = createComponentFactory({
    component: AppActionRequiredBadgeComponent,
    providers: [
      {
        provide: WINDOW,
        useValue: {
          document: { getElementById },
          setTimeout: setTimeoutSpy,
        },
      },
    ],
  });

  function setupTest(app: Partial<App>): void {
    spectator = createComponent({
      props: { app: app as App },
    });
  }

  beforeEach(() => {
    scrollIntoView.mockClear();
    getElementById.mockClear();
    setTimeoutSpy.mockClear();
  });

  it('renders nothing when action_required is false', () => {
    setupTest({ name: 'app1', action_required: false });
    expect(spectator.query('.action-required-badge')).toBeNull();
  });

  it('renders the badge when action_required is true', () => {
    setupTest({ name: 'app1', action_required: true });
    expect(spectator.query('.action-required-badge')).toExist();
  });

  it('scrolls to the Notes card on click', () => {
    setupTest({ name: 'app1', action_required: true });
    spectator.click('.action-required-badge');

    expect(getElementById).toHaveBeenCalledWith('app-notes-card');
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });
});
