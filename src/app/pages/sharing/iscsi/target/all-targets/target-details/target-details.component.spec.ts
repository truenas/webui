import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { IscsiTargetMode } from 'app/enums/iscsi.enum';
import { FibreChannelPort } from 'app/interfaces/fibre-channel.interface';
import { IscsiTarget } from 'app/interfaces/iscsi.interface';
import {
  AssociatedExtentsCardComponent,
} from 'app/pages/sharing/iscsi/target/all-targets/target-details/associated-extents-card/associated-extents-card.component';
import {
  AuthorizedNetworksCardComponent,
} from 'app/pages/sharing/iscsi/target/all-targets/target-details/authorized-networks-card/authorized-networks-card.component';
import {
  FibreChannelPortCardComponent,
} from 'app/pages/sharing/iscsi/target/all-targets/target-details/fibre-channel-port-card/fibre-channel-port-card.component';
import { ApiService } from 'app/services/websocket/api.service';
import { TargetDetailsComponent } from './target-details.component';

describe('TargetDetailsComponent', () => {
  let spectator: Spectator<TargetDetailsComponent>;
  let mockApiService: jest.Mocked<ApiService>;

  const mockPort = {
    id: 1,
    wwpn: '10:00:00:00:c9:20:00:00',
    wwpn_b: '10:00:00:00:c9:20:00:01',
  } as FibreChannelPort;

  const createComponent = createComponentFactory({
    component: TargetDetailsComponent,
    imports: [
      NgxSkeletonLoaderComponent,
      MockComponents(
        AuthorizedNetworksCardComponent,
        FibreChannelPortCardComponent,
        AssociatedExtentsCardComponent,
      ),
    ],
    providers: [
      mockApi([
        mockCall('fcport.query', [mockPort]),
        mockCall('fcport.status', []),
        mockCall('iscsi.extent.query', []),
        mockCall('iscsi.targetextent.query', []),
        mockCall('iscsi.global.sessions', []),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        target: {
          id: 1,
          mode: IscsiTargetMode.Both,
          auth_networks: ['192.168.1.0/24', '10.0.0.0/24'],
        } as IscsiTarget,
      },
    });

    mockApiService = spectator.inject(ApiService);
  });

  it('renders AuthorizedNetworksCardComponent if target has authorized networks', () => {
    expect(spectator.query(AuthorizedNetworksCardComponent)).toExist();
    expect(spectator.query(AuthorizedNetworksCardComponent)?.target).toEqual({
      id: 1,
      mode: IscsiTargetMode.Both,
      auth_networks: ['192.168.1.0/24', '10.0.0.0/24'],
    });
  });

  it('renders FibreChannelPortCardComponent if targetPort is set', () => {
    spectator.detectChanges();
    expect(spectator.query(FibreChannelPortCardComponent)).toExist();
    expect(spectator.query(FibreChannelPortCardComponent)?.port).toEqual(mockPort);
  });

  it('does not render FibreChannelPortCardComponent if no targetPort is available', () => {
    spectator.component.targetPort.set(null);
    spectator.detectChanges();

    expect(spectator.query(FibreChannelPortCardComponent)).toBeNull();
  });

  it('calls API to fetch Fibre Channel ports when target ID changes', () => {
    mockApiService.call.mockReturnValue(of([]));
    spectator.setInput({
      target: {
        id: 2,
        mode: 'FC',
        auth_networks: [],
      } as IscsiTarget,
    });

    spectator.detectChanges();

    expect(mockApiService.call).toHaveBeenCalledWith('fcport.query', [[['target.id', '=', 2]]]);
  });
});
