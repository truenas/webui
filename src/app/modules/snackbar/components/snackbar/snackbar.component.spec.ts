import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { SnackbarConfig } from './snackbar-config.interface';
import { SnackbarComponent } from './snackbar.component';

describe('SnackbarComponent', () => {
  let spectator: Spectator<SnackbarComponent>;
  const createComponent = createComponentFactory({
    component: SnackbarComponent,
    providers: [
      {
        provide: MAT_SNACK_BAR_DATA,
        useValue: {
          message: 'Time to go to bed',
          icon: 'error',
        } as SnackbarConfig,
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows a message from config', () => {
    expect(spectator.query('.message')).toHaveExactText('Time to go to bed');
  });

  it('shows an icon when it is set in config', () => {
    expect(spectator.query('.icon')).toHaveText('error');
  });
});
