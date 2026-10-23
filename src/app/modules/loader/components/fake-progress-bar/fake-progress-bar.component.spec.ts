import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnProgressBarComponent } from '@truenas/ui-components';
import { FakeProgressBarComponent } from './fake-progress-bar.component';

describe('FakeProgressBarComponent', () => {
  let spectator: Spectator<FakeProgressBarComponent>;
  const createComponent = createComponentFactory({
    component: FakeProgressBarComponent,
  });

  beforeEach(() => {
    jest.useFakeTimers();
    spectator = createComponent();
  });

  afterEach(() => {
    // Drops the bar's still-running redraw interval.
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('shows a progress bar when loading is true', () => {
    spectator.setInput('loading', true);
    jest.advanceTimersByTime(200);
    spectator.detectChanges();

    const progressBar = spectator.query(TnProgressBarComponent);
    expect(progressBar).toBeTruthy();
  });

  it('imitates progress by increasing % as time passes, but does so in a way that will never reach 100%', () => {
    spectator.setInput({
      duration: 2000,
      loading: true,
    });
    jest.advanceTimersByTime(200);
    spectator.detectChanges();

    jest.advanceTimersByTime(500);
    spectator.detectChanges();
    expect(Math.floor(spectator.component.progress())).toBe(9);

    jest.advanceTimersByTime(500);
    spectator.detectChanges();
    expect(Math.floor(spectator.component.progress())).toBe(28);

    jest.advanceTimersByTime(500);
    spectator.detectChanges();
    expect(Math.floor(spectator.component.progress())).toBe(37);

    jest.advanceTimersByTime(500);
    spectator.detectChanges();
    expect(Math.floor(spectator.component.progress())).toBe(47);
  });

  it('reaches 100% when loading is switched back to false', () => {
    spectator.setInput('loading', true);
    jest.advanceTimersByTime(200);
    spectator.detectChanges();
    spectator.setInput('loading', false);
    spectator.detectChanges();

    expect(spectator.component.progress()).toBe(100);
  });

  it('hides progress bar when loading is set back to false', () => {
    spectator.setInput('loading', true);
    jest.advanceTimersByTime(200); // Wait for grace period
    spectator.detectChanges();
    spectator.setInput('loading', false);
    jest.advanceTimersByTime(300); // Wait for animation
    spectator.detectChanges();

    const progressBar = spectator.query(TnProgressBarComponent);
    expect(progressBar).toBeFalsy();
  });

  it('does not start animating when destroyed during the grace period', () => {
    spectator.setInput('loading', true);
    spectator.fixture.destroy();

    jest.advanceTimersByTime(400);

    // Starting would leave an interval running that nothing stops once the bar is gone.
    expect(spectator.component.isAnimating()).toBe(false);
  });
});
