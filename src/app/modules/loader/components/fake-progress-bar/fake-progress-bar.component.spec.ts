import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  discardPeriodicTasks, fakeAsync, tick,
} from '@angular/core/testing';
import { MatProgressBarHarness } from '@angular/material/progress-bar/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { FakeProgressBarComponent } from './fake-progress-bar.component';

describe('FakeProgressBarComponent', () => {
  let spectator: Spectator<FakeProgressBarComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: FakeProgressBarComponent,
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows a progress bar when loading is true', fakeAsync(async () => {
    spectator.setInput('loading', true);

    const progressBar = await loader.getHarness(MatProgressBarHarness);
    expect(progressBar).toBeTruthy();

    discardPeriodicTasks();
  }));

  it('imitates progress by increasing % as time passes, but does so in a way that will never reach 100%', fakeAsync(async () => {
    spectator.setInput({
      duration: 2000,
      loading: true,
    });

    const progressBar = await loader.getHarness(MatProgressBarHarness);
    tick(500);
    expect(Math.floor(await progressBar.getValue())).toBe(9);
    tick(500);
    expect(Math.floor(await progressBar.getValue())).toBe(28);
    tick(500);
    expect(Math.floor(await progressBar.getValue())).toBe(37);
    tick(500);
    expect(Math.floor(await progressBar.getValue())).toBe(47);

    discardPeriodicTasks();
  }));

  it('reaches 100% when loading is switched back to false', async () => {
    spectator.setInput('loading', true);
    spectator.setInput('loading', false);

    const progressBar = await loader.getHarness(MatProgressBarHarness);
    expect(await progressBar.getValue()).toBe(100);
  });

  it('when hideOnComplete is true, it hides progress bar when loading is set back to false', fakeAsync(async () => {
    spectator.setInput({
      hideOnComplete: true,
      loading: true,
    });
    spectator.setInput('loading', false);
    tick();

    const progressBar = await loader.getHarnessOrNull(MatProgressBarHarness);
    expect(progressBar).toBeNull();
  }));
});
