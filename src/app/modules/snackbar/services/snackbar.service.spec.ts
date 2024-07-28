import { MatSnackBar } from '@angular/material/snack-bar';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { SnackbarComponent } from 'app/modules/snackbar/components/snackbar/snackbar.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';

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
    it('opens a snackbar with message', () => {
      spectator.service.success('All good');

      expect(spectator.inject(MatSnackBar).openFromComponent).toHaveBeenCalledWith(SnackbarComponent, {
        announcementMessage: 'All good',
        politeness: 'assertive',
        data: {
          message: 'All good',
          icon: 'check',
          iconCssColor: 'var(--green)',
        },
      });
    });
  });
});
