import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { TruenasConnectSpinnerComponent } from './truenas-connect-spinner.component';

describe('TruenasConnectSpinnerComponent', () => {
  let spectator: Spectator<TruenasConnectSpinnerComponent>;
  const createComponent = createComponentFactory({
    component: TruenasConnectSpinnerComponent,
  });

  beforeAll(() => {
    // Mock animation functions for tests
    jest.useFakeTimers();
    global.requestAnimationFrame = jest.fn((cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    }) as unknown as typeof requestAnimationFrame;
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    spectator = createComponent();
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

  it('should start animation on init', () => {
    const requestAnimationFrameSpy = jest.spyOn(global, 'requestAnimationFrame');
    spectator.component.ngAfterViewInit();
    expect(requestAnimationFrameSpy).toHaveBeenCalled();
  });

  it('should cancel animation on destroy', () => {
    const cancelAnimationFrameSpy = jest.spyOn(global, 'cancelAnimationFrame');
    spectator.component.ngAfterViewInit();
    spectator.component.ngOnDestroy();
    expect(cancelAnimationFrameSpy).toHaveBeenCalled();
  });
});
