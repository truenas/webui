import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { SnackbarConfig } from './snackbar-config.interface';
import { SnackbarComponent } from './snackbar.component';

describe('SnackbarComponent', () => {
  const fakeAction = jest.fn();
  let loader: HarnessLoader;
  let spectator: Spectator<SnackbarComponent>;
  const createComponent = createComponentFactory({
    component: SnackbarComponent,
    declarations: [
      MockComponent(IxIconComponent),
    ],
    providers: [
      {
        provide: MAT_SNACK_BAR_DATA,
        useValue: {
          message: 'Time to go to bed',
          icon: iconMarker('error'),
          button: {
            title: 'Test Button',
            action: fakeAction,
          },
        } as SnackbarConfig,
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows a message from config', () => {
    expect(spectator.query('.message')).toHaveExactText('Time to go to bed');
  });

  it('shows an icon when it is set in config', () => {
    expect(spectator.query(IxIconComponent)!.name).toBe('error');
  });

  it('shows the button and executes the action when it is set in config', async () => {
    const testButton = await loader.getHarnessOrNull(MatButtonHarness.with({ text: 'Test Button' }));
    expect(testButton).not.toBeNull();

    await testButton!.click();
    expect(fakeAction).toHaveBeenCalled();
  });
});
