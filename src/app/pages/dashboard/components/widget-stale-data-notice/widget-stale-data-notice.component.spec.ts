import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { WidgetStaleDataNoticeComponent } from './widget-stale-data-notice.component';

describe('WidgetStaleDataNoticeComponent', () => {
  let spectator: Spectator<WidgetStaleDataNoticeComponent>;

  const createComponent = createComponentFactory({
    component: WidgetStaleDataNoticeComponent,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should display the notice message', () => {
    const messageElement = spectator.query('.message');
    expect(messageElement).toHaveText(
      'We are working in the background to generate relevant data. Please try again in a few minutes.',
    );
  });

  it('should display an icon', () => {
    const icon = spectator.query('ix-icon');
    expect(icon).toExist();
  });

  it('should not have a border', () => {
    const container = spectator.query('.container');
    expect(container).toExist();
    expect(spectator.query('mat-card')).not.toExist();
  });
});
