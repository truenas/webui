import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { TnIconHarness } from '@truenas/ui-components';
import { mockTnSpriteLoader } from 'app/core/testing/utils/mock-tn-sprite-loader.utils';
import { StatusBadgeComponent } from 'app/modules/layout/topbar/status-badge/status-badge.component';

describe('StatusBadgeComponent', () => {
  let spectator: Spectator<StatusBadgeComponent>;
  const createComponent = createComponentFactory({
    component: StatusBadgeComponent,
    providers: [mockTnSpriteLoader()],
  });

  it('applies the given background as an inline style', () => {
    spectator = createComponent({ props: { badge: { icon: 'check', background: 'var(--green)' } } });
    expect(spectator.element.style.background).toBe('var(--green)');
  });

  it('applies the spinning class when spinning is true on an icon badge', () => {
    spectator = createComponent({
      props: { badge: { icon: 'clock-outline', background: 'var(--yellow)', spinning: true } },
    });
    expect(spectator.element).toHaveClass('spinning');
  });

  it('does not apply the spinning class for label badges', () => {
    spectator = createComponent({ props: { badge: { label: '+', background: 'var(--blue)' } } });
    expect(spectator.element).not.toHaveClass('spinning');
  });

  it('marks the host as decorative for screen readers', () => {
    spectator = createComponent({ props: { badge: { icon: 'check', background: 'var(--green)' } } });
    expect(spectator.element.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders the given icon name on the inner tn-icon', async () => {
    spectator = createComponent({ props: { badge: { icon: 'close', background: 'var(--red)' } } });
    const loader: HarnessLoader = TestbedHarnessEnvironment.loader(spectator.fixture);
    const icon = await loader.getHarness(TnIconHarness);
    expect(await icon.getName()).toBe('close');
  });

  it('renders a label when a label badge is provided instead of an icon', () => {
    spectator = createComponent({ props: { badge: { label: '+', background: 'var(--blue)' } } });
    expect(spectator.query('.label')).toHaveText('+');
    expect(spectator.query('tn-icon')).not.toExist();
  });
});
