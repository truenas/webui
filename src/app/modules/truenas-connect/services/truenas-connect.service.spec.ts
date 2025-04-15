import {
  createServiceFactory,
  SpectatorService,
} from '@ngneat/spectator/jest';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import {
  TruenasConnectStatus,
  TruenasConnectStatusReason,
} from 'app/enums/truenas-connect-status.enum';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { ApiService } from 'app/modules/websocket/api.service';

describe('TruenasConnectService', () => {
  let spectator: SpectatorService<TruenasConnectService>;
  const config: TruenasConnectConfig = {
    id: 1,
    ips: [''],
    enabled: true,
    tnc_base_url: 'https://tnc-test.ixsystems.com',
    account_service_base_url: 'https://account-service-test.ixsystems.com',
    leca_service_base_url: 'https://leca-test.ixsystems.com',
    heartbeat_url: 'https://heartbeat-test.ixsystems.com',
    status: TruenasConnectStatus.Configured,
    status_reason: TruenasConnectStatusReason[TruenasConnectStatus.Configured],
    registration_details: {
      scopes: [],
      account_id: '',
      system_id: '',
      account_name: '',
      exp: 0,
      iat: 0,
      iss: '',
    },
    certificate: 0,
  };
  const url
    = 'https://tnc.ixsystems.net/en/#/auth/login?redirectUrl=%2Fsystem%2Fregister%3Fversion%3D25.10.0-MASTER-20250409-224807%26model%3DUNKNOWN%26system_id%3D249cdb8d-5bfc-49f0-981b-f2184eb7992e%26token%3Deb48fa51-6e6e-4f4f-ab30-976bb209bfa6';
  const createService = createServiceFactory({
    service: TruenasConnectService,
    providers: [
      mockApi([
        mockCall('tn_connect.config', config),
        mockCall('tn_connect.update', {
          ...config,
          status: TruenasConnectStatus.Disabled,
        }),
        mockCall('tn_connect.generate_claim_token'),
        mockCall('tn_connect.get_registration_uri', url),
      ]),
      mockWindow({
        open: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('should disable a tnc service', () => {
    spectator.service.disableService().subscribe();
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
      'tn_connect.update',
      [
        {
          ips: [''],
          enabled: false,
          tnc_base_url: config.tnc_base_url,
          account_service_base_url: config.account_service_base_url,
          leca_service_base_url: config.leca_service_base_url,
          heartbeat_url: config.heartbeat_url,
        },
      ],
    );
  });

  it('should enable a tnc service', () => {
    spectator.service.enableService().subscribe();
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
      'tn_connect.update',
      [
        {
          ips: [''],
          enabled: true,
          tnc_base_url: config.tnc_base_url,
          account_service_base_url: config.account_service_base_url,
          leca_service_base_url: config.leca_service_base_url,
          heartbeat_url: config.heartbeat_url,
        },
      ],
    );
  });

  it('should generate claim_token', () => {
    spectator.service.generateToken().subscribe();
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
      'tn_connect.generate_claim_token',
    );
  });

  it('should connect to TNC', () => {
    spectator.service.connect().subscribe();
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
      'tn_connect.get_registration_uri',
    );
  });
});
