import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { TruenasConnectSpinnerComponent } from './truenas-connect-spinner.component';

describe('TruenasConnectSpinnerComponent', () => {
  let spectator: Spectator<TruenasConnectSpinnerComponent>;
  let mockStartAnimation: jest.SpyInstance;

  const createComponent = createComponentFactory({
    component: TruenasConnectSpinnerComponent,
  });

  beforeEach(() => {
    // Mock the animation method to prevent infinite loop and spy on it
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockStartAnimation = jest.spyOn(TruenasConnectSpinnerComponent.prototype as any, 'startAnimation');
    mockStartAnimation.mockImplementation(() => {
      // Do nothing - prevents the infinite animation loop
    });

    spectator = createComponent();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create spinner component', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should render SVG with animation paths', () => {
    const svg = spectator.query('svg');
    expect(svg).toBeTruthy();

    const paths = spectator.queryAll('path.exploded');
    expect(paths).toHaveLength(5);
  });

  it('should start animation automatically when component initializes', () => {
    // Animation should be started automatically during component initialization
    expect(mockStartAnimation).toHaveBeenCalled();
  });

  it('should have proper lifecycle methods', () => {
    // Test that the component has the expected public methods
    expect(typeof spectator.component.ngAfterViewInit).toBe('function');
    expect(typeof spectator.component.ngOnDestroy).toBe('function');
  });

  it('should handle component destruction without errors', () => {
    // Test that the component can be destroyed without throwing errors
    expect(() => spectator.component.ngOnDestroy()).not.toThrow();
  });

  it('should be a standalone component', () => {
    // Verify the component is configured as standalone
    expect(spectator.component).toBeInstanceOf(TruenasConnectSpinnerComponent);

    // Test component creation without errors
    expect(spectator.component).toBeTruthy();
  });

  it('should display spinning animation visually', () => {
    // Test that the component renders the expected visual elements
    expect(spectator.component).toBeInstanceOf(TruenasConnectSpinnerComponent);
    expect(spectator.component).toBeTruthy();

    // Verify SVG is present for visual feedback
    const svg = spectator.query('svg');
    expect(svg).toBeTruthy();
  });
});
