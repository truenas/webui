import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { TnIconHarness, TnSpriteLoaderService } from '@truenas/ui-components';
import { StatusBadgeComponent } from 'app/modules/layout/topbar/status-badge/status-badge.component';

describe('StatusBadgeComponent', () => {
  let spectator: Spectator<StatusBadgeComponent>;
  const createComponent = createComponentFactory({
    component: StatusBadgeComponent,
    providers: [
      mockProvider(TnSpriteLoaderService, {
        ensureSpriteLoaded: jest.fn(() => Promise.resolve(true)),
        getIconUrl: jest.fn(),
        getSafeIconUrl: jest.fn(),
        isSpriteLoaded: jest.fn(() => true),
        getSpriteConfig: jest.fn(),
      }),
    ],
  });

  it('applies the success class when kind is success', () => {
    spectator = createComponent({ props: { icon: 'check', kind: 'success' } });
    expect(spectator.element).toHaveClass('success');
    expect(spectator.element).not.toHaveClass('error');
  });

  it('applies the error class when kind is error', () => {
    spectator = createComponent({ props: { icon: 'close', kind: 'error' } });
    expect(spectator.element).toHaveClass('error');
    expect(spectator.element).not.toHaveClass('success');
  });

  it('applies a tier class when kind is a tier variant', () => {
    spectator = createComponent({ props: { label: 'F', kind: 'tier-foundation' } });
    expect(spectator.element).toHaveClass('tier-foundation');
  });

  it('marks the host as decorative for screen readers', () => {
    spectator = createComponent({ props: { icon: 'check', kind: 'success' } });
    expect(spectator.element.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders the given icon name on the inner tn-icon', async () => {
    spectator = createComponent({ props: { icon: 'close', kind: 'error' } });
    const loader: HarnessLoader = TestbedHarnessEnvironment.loader(spectator.fixture);
    const icon = await loader.getHarness(TnIconHarness);
    expect(await icon.getName()).toBe('close');
  });

  it('renders a label when label is provided instead of an icon', () => {
    spectator = createComponent({ props: { label: '+', kind: 'tier-plus' } });
    expect(spectator.query('.label')).toHaveText('+');
    expect(spectator.query('tn-icon')).not.toExist();
  });
});
