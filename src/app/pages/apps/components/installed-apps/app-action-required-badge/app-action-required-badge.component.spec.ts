import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { App } from 'app/interfaces/app.interface';
import {
  AppActionRequiredBadgeComponent,
} from 'app/pages/apps/components/installed-apps/app-action-required-badge/app-action-required-badge.component';

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
    setupTest({ name: 'app1', action_required: false, notes: 'do something' });
    expect(spectator.query('.action-required-badge')).toBeNull();
  });

  it('renders nothing when notes are empty even if action_required is true', () => {
    setupTest({ name: 'app1', action_required: true, notes: '' });
    expect(spectator.query('.action-required-badge')).toBeNull();
  });

  it('renders an alert icon button when action_required is true and notes are present', () => {
    setupTest({ name: 'app1', action_required: true, notes: 'do something' });
    expect(spectator.query('.action-required-badge')).toExist();
    expect(spectator.query('.action-required-badge tn-icon')).toExist();
  });

  it('emits actionRequiredClicked when the badge is clicked', () => {
    setupTest({ name: 'app1', action_required: true, notes: 'do something' });
    const emitSpy = jest.fn();
    spectator.component.actionRequiredClicked.subscribe(emitSpy);

    spectator.click('.action-required-badge');

    expect(emitSpy).toHaveBeenCalledTimes(1);
  });

  it('stops click propagation so the row click handler does not also fire', () => {
    setupTest({ name: 'app1', action_required: true, notes: 'do something' });

    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    const stopPropagationSpy = jest.spyOn(event, 'stopPropagation');
    spectator.query('.action-required-badge')!.dispatchEvent(event);

    expect(stopPropagationSpy).toHaveBeenCalled();
  });
});
