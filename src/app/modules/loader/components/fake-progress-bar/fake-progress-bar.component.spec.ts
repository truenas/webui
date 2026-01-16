import { fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { FakeProgressBarComponent } from './fake-progress-bar.component';

describe('FakeProgressBarComponent', () => {
  let spectator: Spectator<FakeProgressBarComponent>;
  const createComponent = createComponentFactory({
    component: FakeProgressBarComponent,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows a progress bar when loading is true', fakeAsync(() => {
    spectator.setInput('loading', true);
    tick(200);
    spectator.detectChanges();

    const progressBar = spectator.query('mat-progress-bar');
    expect(progressBar).toBeTruthy();

    discardPeriodicTasks();
  }));

  it('imitates progress by increasing % as time passes, but does so in a way that will never reach 100%', fakeAsync(() => {
    spectator.setInput({
      duration: 2000,
      loading: true,
    });
    tick(200);
    spectator.detectChanges();

    tick(500);
    spectator.detectChanges();
    expect(Math.floor(spectator.component.progress())).toBe(9);

    tick(500);
    spectator.detectChanges();
    expect(Math.floor(spectator.component.progress())).toBe(28);

    tick(500);
    spectator.detectChanges();
    expect(Math.floor(spectator.component.progress())).toBe(37);

    tick(500);
    spectator.detectChanges();
    expect(Math.floor(spectator.component.progress())).toBe(47);

    discardPeriodicTasks();
  }));

  it('reaches 100% when loading is switched back to false', fakeAsync(() => {
    spectator.setInput('loading', true);
    tick(200);
    spectator.detectChanges();
    spectator.setInput('loading', false);
    spectator.detectChanges();

    expect(spectator.component.progress()).toBe(100);
  }));

  it('hides progress bar when loading is set back to false', fakeAsync(() => {
    spectator.setInput('loading', true);
    tick(200); // Wait for grace period
    spectator.detectChanges();
    spectator.setInput('loading', false);
    tick(300); // Wait for animation
    spectator.detectChanges();

    const progressBar = spectator.query('mat-progress-bar');
    expect(progressBar).toBeFalsy();
  }));
});
