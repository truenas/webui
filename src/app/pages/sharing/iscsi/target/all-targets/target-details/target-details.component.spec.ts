import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { MockTypedApiService } from 'app/core/testing/classes/mock-typed-api.service';
import { mockTypedApi, mockTypedCall, mockTypedQuery } from 'app/core/testing/utils/mock-typed-api.utils';
import { IscsiTargetMode } from 'app/enums/iscsi.enum';
import { IscsiTarget } from 'app/interfaces/iscsi.interface';
import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import {
  AssociatedExtentsCardComponent,
} from 'app/pages/sharing/iscsi/target/all-targets/target-details/associated-extents-card/associated-extents-card.component';
import {
  AuthorizedNetworksCardComponent,
} from 'app/pages/sharing/iscsi/target/all-targets/target-details/authorized-networks-card/authorized-networks-card.component';
import {
  FibreChannelPortCardComponent,
} from 'app/pages/sharing/iscsi/target/all-targets/target-details/fibre-channel-port-card/fibre-channel-port-card.component';
import { IscsiGroupsCardComponent } from 'app/pages/sharing/iscsi/target/all-targets/target-details/iscsi-groups-card/iscsi-groups-card.component';
import { TargetDetailsComponent } from './target-details.component';

describe('TargetDetailsComponent', () => {
  let spectator: Spectator<TargetDetailsComponent>;
  let mockApiService: MockTypedApiService;

  const mockPort = {
    id: 1,
    wwpn: '10:00:00:00:c9:20:00:00',
    wwpn_b: '10:00:00:00:c9:20:00:01',
  } as WebUiQueryEntity<'fcport.query'>;

  const createComponent = createComponentFactory({
    component: TargetDetailsComponent,
    imports: [
      NgxSkeletonLoaderComponent,
      MockComponents(
        AuthorizedNetworksCardComponent,
        IscsiGroupsCardComponent,
        FibreChannelPortCardComponent,
        AssociatedExtentsCardComponent,
      ),
    ],
    providers: [
      mockTypedApi([
        mockTypedQuery('fcport.query', [mockPort]),
        mockTypedCall('fcport.status', []),
        mockTypedQuery('iscsi.extent.query', []),
        mockTypedQuery('iscsi.targetextent.query', []),
        mockTypedQuery('iscsi.global.sessions', []),
        mockTypedQuery('iscsi.target.query', []),
        mockTypedQuery('iscsi.initiator.query', []),
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

    mockApiService = spectator.inject(MockTypedApiService);
  });

  it('renders AuthorizedNetworksCardComponent if target has authorized networks', () => {
    expect(spectator.query(AuthorizedNetworksCardComponent)).toExist();
    expect(spectator.query(AuthorizedNetworksCardComponent)?.target).toEqual({
      id: 1,
      mode: IscsiTargetMode.Both,
      auth_networks: ['192.168.1.0/24', '10.0.0.0/24'],
    });
  });

  it('renders IscsiGroupsCardComponent if target has groups', () => {
    expect(spectator.query(IscsiGroupsCardComponent)).toExist();
  });

  it('renders FibreChannelPortCardComponent if targetPorts are set', () => {
    spectator.detectChanges();
    expect(spectator.query(FibreChannelPortCardComponent)).toExist();
    expect(spectator.query(FibreChannelPortCardComponent)?.ports).toEqual([mockPort]);
  });

  it('should render FibreChannelPortCardComponent even if no targetPorts are available', () => {
    spectator.component.targetPorts.set([]);
    spectator.detectChanges();

    expect(spectator.query(FibreChannelPortCardComponent)).not.toBeNull();
  });

  it('calls API to fetch Fibre Channel ports when target ID changes', () => {
    spectator.setInput({
      target: {
        id: 2,
        mode: 'FC',
        auth_networks: [] as string[],
      } as IscsiTarget,
    });

    spectator.detectChanges();

    expect(mockApiService.query).toHaveBeenCalledWith('fcport.query', [['target.id', '=', 2]]);
  });
});
