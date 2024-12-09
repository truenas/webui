import { HttpClient } from '@angular/common/http';
import {
  createServiceFactory,
  mockProvider,
  SpectatorService,
} from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { WINDOW } from 'app/helpers/window.helper';
import { ReportsService } from 'app/pages/reports-dashboard/reports.service';

describe('ReportsService', () => {
  let spectator: SpectatorService<ReportsService>;
  const createComponent = createServiceFactory({
    service: ReportsService,
    providers: [
      mockAuth(),
      mockWindow(),
      mockProvider(HttpClient, {
        get: jest.fn(() => of(undefined)),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  describe('openNetdata', () => {
    it('makes a request to netdata url to pre-set http authentication and then opens a new tab', () => {
      spectator.service.openNetdata('netdata_password');

      expect(spectator.inject(HttpClient).get).toHaveBeenCalledWith(
        'http://root:netdata_password@truenas.com/netdata/',
        { responseType: 'text' },
      );
      expect(spectator.inject<Window>(WINDOW).open).toHaveBeenCalledWith('/netdata/');
    });
  });

  describe('removeDstGaps', () => {
    it('returns normal data without changes', () => {
      expect(spectator.service.removeDstGaps([
        [1732000500, 0],
        [1732000501, 1],
        [1732000502, 2],
      ])).toEqual([
        [1732000500, 0],
        [1732000501, 1],
        [1732000502, 2],
      ]);
    });

    it('removes gap from data', () => {
      expect(spectator.service.removeDstGaps([
        [1732000500, 0],
        [1732000501 + 3600, 1],
        [1732000502 + 3600, 2],
      ])).toEqual([
        [1732000500, 0],
        [1732000501, 1],
        [1732000502, 2],
      ]);
    });

    it('removes several gaps from data', () => {
      expect(spectator.service.removeDstGaps([
        [1732000500, 0],
        [1732000501 + 3600, 1],
        [1732000502 + 3600, 2],
        [1732000503 + 3600 * 2, 3],
        [1732000504 + 3600 * 2, 4],
      ])).toEqual([
        [1732000500, 0],
        [1732000501, 1],
        [1732000502, 2],
        [1732000503, 3],
        [1732000504, 4],
      ]);
    });
  });
});
