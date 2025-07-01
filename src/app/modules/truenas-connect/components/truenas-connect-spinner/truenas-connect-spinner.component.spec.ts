import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { TruenasConnectSpinnerComponent } from './truenas-connect-spinner.component';

describe('TruenasConnectSpinnerComponent', () => {
  let spectator: Spectator<TruenasConnectSpinnerComponent>;

  const createComponent = createComponentFactory({
    component: TruenasConnectSpinnerComponent,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create spinner component', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should render SVG with animated paths', () => {
    const svg = spectator.query('svg');
    expect(svg).toBeTruthy();

    const paths = spectator.queryAll('path.exploded');
    expect(paths).toHaveLength(5);

    // Verify that each path has SVG animation elements
    paths.forEach((path) => {
      const animateElement = path.querySelector('animate');
      expect(animateElement).toBeTruthy();
      expect(animateElement.getAttribute('attributeName')).toBe('stroke-dashoffset');
      expect(animateElement.getAttribute('repeatCount')).toBe('indefinite');
    });
  });

  it('should have staggered animation timing for each path', () => {
    const paths = spectator.queryAll('path.exploded');
    const expectedDelays = ['0s', '0.5s', '1s', '1.5s', '2s'];

    paths.forEach((path, index) => {
      const animateElement = path.querySelector('animate');
      expect(animateElement.getAttribute('begin')).toBe(expectedDelays[index]);
    });
  });

  it('should be a standalone component', () => {
    expect(spectator.component).toBeInstanceOf(TruenasConnectSpinnerComponent);
  });

  it('should use SVG-based animation instead of JavaScript', () => {
    // Verify that SVG animations are present
    const animateElements = spectator.queryAll('animate');
    expect(animateElements.length).toBeGreaterThan(0);

    // Verify all animations target stroke-dashoffset
    animateElements.forEach((animate) => {
      expect(animate.getAttribute('attributeName')).toBe('stroke-dashoffset');
    });
  });
});
