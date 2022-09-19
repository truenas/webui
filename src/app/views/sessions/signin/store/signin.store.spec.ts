import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { FailoverStatus } from 'app/enums/failover-status.enum';
import { SigninStore } from 'app/views/sessions/signin/store/signin.store';

describe('SigninStore', () => {
  let spectator: SpectatorService<SigninStore>;

  const createService = createServiceFactory({
    service: SigninStore,

  });

  beforeEach(() => {
    spectator = createService();
  });

  describe('selectors', () => {
    beforeEach(() => {
      spectator.service.setState({
        hasRootPassword: true,
        failover: {
          status: FailoverStatus.Error,
          ips: ['23.234.124.123'],
          disabledReasons: [FailoverDisabledReason.NoPong, FailoverDisabledReason.NoLicense],
        },
        isLoading: false,
      });
    });

    it('hasRootPassword$', () => {
    });
  });

  describe('effects', () => {

  });

  describe('updaters', () => {

  });
});
