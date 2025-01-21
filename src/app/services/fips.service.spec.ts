import { Router } from '@angular/router';
import {
  createServiceFactory,
  mockProvider,
  SpectatorService,
} from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { FipsService } from 'app/services/fips.service';

describe('FipsService', () => {
  let spectator: SpectatorService<FipsService>;
  const createService = createServiceFactory({
    service: FipsService,
    providers: [
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
        jobDialog: jest.fn(() => ({
          afterClosed: () => of({}),
        })),
      }),
      mockProvider(Router),
      mockApi([
        mockJob('failover.reboot.other_node', fakeSuccessfulJob()),
      ]),
      mockProvider(AuthService, {
        clearAuthToken: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  describe('promptForLocalRestart', () => {
    it('prompts for local standby and redirects to restart page', () => {
      spectator.service.promptForRestart().subscribe();

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          buttonText: 'Restart Now',
        }),
      );
      expect(spectator.inject(AuthService).clearAuthToken).toHaveBeenCalled();
      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/system-tasks/restart'], { skipLocationChange: true });
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
      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/system-tasks/failover'], { skipLocationChange: true });
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
      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('failover.reboot.other_node');
      expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    });
  });
});
