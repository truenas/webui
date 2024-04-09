import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  createServiceFactory,
  mockProvider,
  SpectatorService,
} from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockEntityJobComponentRef } from 'app/core/testing/utils/mock-entity-job-component-ref.utils';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FipsService } from 'app/services/fips.service';

describe('FipsService', () => {
  let spectator: SpectatorService<FipsService>;
  const createService = createServiceFactory({
    service: FipsService,
    providers: [
      mockProvider(MatDialog, {
        open: jest.fn(() => mockEntityJobComponentRef),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(Router),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  describe('promptForLocalRestart', () => {
    it('prompts for local standby and redirects to reboot page', () => {
      spectator.service.promptForRestart().subscribe();

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          buttonText: 'Restart Now',
        }),
      );
      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/others/reboot'], { skipLocationChange: true });
    });
  });

  describe('promptForFailover', () => {
    it('prompts for failover and redirects to failover page', () => {
      spectator.service.promptForFailover().subscribe();

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          buttonText: 'Failover Now',
        }),
      );
      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/others/failover'], { skipLocationChange: true });
    });
  });

  describe('promptToRestartRemote', () => {
    it('prompts to restart standby and restarts with progress indication', () => {
      spectator.service.promptForRemoteRestart().subscribe();

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          buttonText: 'Restart Standby',
        }),
      );
      expect(mockEntityJobComponentRef.componentInstance.setCall).toHaveBeenCalledWith('failover.reboot.other_node');
      expect(mockEntityJobComponentRef.componentInstance.submit).toHaveBeenCalled();
    });
  });
});
