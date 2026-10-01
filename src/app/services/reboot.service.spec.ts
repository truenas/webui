import { Router } from '@angular/router';
import {
  createServiceFactory,
  mockProvider,
  SpectatorService,
} from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockTypedApi, mockTypedJob } from 'app/core/testing/utils/mock-typed-api.utils';
import { JobState } from 'app/enums/job-state.enum';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { RebootService } from 'app/services/reboot.service';

describe('RebootService', () => {
  let spectator: SpectatorService<RebootService>;
  const createService = createServiceFactory({
    service: RebootService,
    providers: [
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
        jobDialog: jest.fn(() => ({
          afterClosed: () => of({}),
        })),
      }),
      mockProvider(Router),
      mockTypedApi([
        mockTypedJob('failover.reboot.other_node', { state: JobState.Success }),
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
      expect(spectator.inject(TypedApiService).job).toHaveBeenCalledWith('failover.reboot.other_node');
      expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    });
  });

  describe('restart', () => {
    it('navigates to restart page without reason when no reason provided', () => {
      spectator.service.restart();

      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(
        ['/system-tasks/restart'],
        {
          skipLocationChange: true,
          queryParams: undefined,
        },
      );
    });

    it('navigates to restart page with reason when reason is provided', () => {
      spectator.service.restart('Test Reboot Reason');

      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(
        ['/system-tasks/restart'],
        {
          skipLocationChange: true,
          queryParams: { reason: 'Test Reboot Reason' },
        },
      );
    });
  });
});
