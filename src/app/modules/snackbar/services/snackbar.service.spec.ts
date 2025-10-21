import { MatSnackBar } from '@angular/material/snack-bar';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { SnackbarComponent } from 'app/modules/snackbar/components/snackbar/snackbar.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ignoreTranslation } from 'app/modules/translate/translate.helper';

describe('SnackbarService', () => {
  let spectator: SpectatorService<SnackbarService>;
  const createService = createServiceFactory({
    service: SnackbarService,
    providers: [
      mockProvider(MatSnackBar),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  describe('success', () => {
    it('opens a snackbar with message at top position', () => {
      spectator.service.success(ignoreTranslation('All good'));

      expect(spectator.inject(MatSnackBar).openFromComponent).toHaveBeenCalledWith(SnackbarComponent, {
        announcementMessage: 'All good',
        politeness: 'assertive',
        panelClass: 'ix-snackbar-high-priority',
        duration: 5000,
        verticalPosition: 'top',
        data: {
          message: 'All good',
          icon: 'mdi-check',
          iconCssColor: 'var(--green)',
          button: undefined,
        },
      });
    });
  });
});
