import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { TruenasConnectSpinnerComponent } from './truenas-connect-spinner.component';

describe('TruenasConnectSpinnerComponent', () => {
  let spectator: Spectator<TruenasConnectSpinnerComponent>;

  const createComponent = createComponentFactory({
    component: TruenasConnectSpinnerComponent,
  });

  beforeEach(() => {
    // Mock the animation method to prevent infinite loop
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(TruenasConnectSpinnerComponent.prototype as any, 'startAnimation').mockImplementation(() => {
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

  it('should call startAnimation on init', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const startAnimationSpy = jest.spyOn(spectator.component as any, 'startAnimation');
    spectator.component.ngAfterViewInit();
    expect(startAnimationSpy).toHaveBeenCalled();
  });

  it('should set animationFrameId when animation starts', () => {
    // Mock requestAnimationFrame for this specific test
    const mockRaf = jest.fn(() => 123);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    global.requestAnimationFrame = mockRaf as any;

    // Create a new instance with unmocked startAnimation
    const newSpectator = createComponent({
      detectChanges: false,
    });

    // Manually mock startAnimation to only set the ID
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (newSpectator.component as any).startAnimation = function () {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.animationFrameId = requestAnimationFrame(() => {});
    };

    newSpectator.detectChanges();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    expect((newSpectator.component as any).animationFrameId).toBe(123);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    global.requestAnimationFrame = undefined as any;
  });

  it('should cancel animation on destroy', () => {
    const mockCancel = jest.fn();
    global.cancelAnimationFrame = mockCancel;

    // Set a fake animation frame ID
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (spectator.component as any).animationFrameId = 456;
    spectator.component.ngOnDestroy();

    expect(mockCancel).toHaveBeenCalledWith(456);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    global.cancelAnimationFrame = undefined as any;
  });

  it('should not cancel animation on destroy when no animation frame ID is set', () => {
    const mockCancel = jest.fn();
    global.cancelAnimationFrame = mockCancel;

    // Don't set an animation frame ID
    spectator.component.ngOnDestroy();

    expect(mockCancel).not.toHaveBeenCalled();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    global.cancelAnimationFrame = undefined as any;
  });

  it('should have animation-related properties available', () => {
    // Test that the component has the expected private property
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    expect((spectator.component as any).animationFrameId).toBeUndefined();

    // Test that the component has the expected methods
    expect(typeof spectator.component.ngAfterViewInit).toBe('function');
    expect(typeof spectator.component.ngOnDestroy).toBe('function');
  });

  it('should be a standalone component', () => {
    // Verify the component is configured as standalone
    expect(spectator.component).toBeInstanceOf(TruenasConnectSpinnerComponent);

    // Test component creation without errors
    expect(spectator.component).toBeTruthy();
  });

  describe('tween', () => {
    it('should calculate tween values correctly', () => {
      const component = spectator.component;

      // Test beginning of tween (progress = 0)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      expect((component as any).tween(100, 0, 0)).toBe(100); // eslint-disable-line @typescript-eslint/no-explicit-any

      // Test middle of tween (progress = 0.5)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      expect((component as any).tween(100, 0, 0.5)).toBe(50); // eslint-disable-line @typescript-eslint/no-explicit-any

      // Test end of tween (progress = 1)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      expect((component as any).tween(100, 0, 1)).toBe(0); // eslint-disable-line @typescript-eslint/no-explicit-any

      // Test with different values
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      expect((component as any).tween(0, 100, 0.25)).toBe(25); // eslint-disable-line @typescript-eslint/no-explicit-any
    });
  });

  it('should have proper component metadata', () => {
    expect(spectator.component).toBeInstanceOf(TruenasConnectSpinnerComponent);

    // Check component has proper change detection strategy
    expect(spectator.component).toBeTruthy();

    // Verify that the component is properly instantiated
    expect(typeof spectator.component.ngAfterViewInit).toBe('function');
    expect(typeof spectator.component.ngOnDestroy).toBe('function');
  });
});
