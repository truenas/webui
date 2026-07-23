import { signal } from '@angular/core';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponents, MockInstance } from 'ng-mocks';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Pool } from 'app/interfaces/pool.interface';
import { IscsiCardComponent } from 'app/pages/sharing/components/shares-dashboard/iscsi-card/iscsi-card.component';
import { NfsCardComponent } from 'app/pages/sharing/components/shares-dashboard/nfs-card/nfs-card.component';
import { NvmeOfCardComponent } from 'app/pages/sharing/components/shares-dashboard/nvme-of-card/nvme-of-card.component';
import { SharesDashboardComponent } from 'app/pages/sharing/components/shares-dashboard/shares-dashboard.component';
import { SmbCardComponent } from 'app/pages/sharing/components/shares-dashboard/smb-card/smb-card.component';
import { WebShareCardComponent } from 'app/pages/sharing/components/shares-dashboard/webshare-card/webshare-card.component';
import { poolStore } from 'app/services/global-store/stores.constant';
import { LicenseService } from 'app/services/license.service';

describe('SharesDashboardComponent', () => {
  MockInstance.scope();

  let spectator: Spectator<SharesDashboardComponent>;
  const createComponent = createComponentFactory({
    component: SharesDashboardComponent,
    providers: [
      mockAuth(),
      mockProvider(poolStore, {
        call: of([{ id: 1 }] as Pool[]),
      }),
      provideMockStore({
        initialState: {
          systemInfo: {
            systemInfo: { license: null },
          },
        },
      }),
    ],
    declarations: [
      MockComponents(
        SmbCardComponent,
        NfsCardComponent,
        IscsiCardComponent,
        NvmeOfCardComponent,
        WebShareCardComponent,
      ),
    ],
  });

  function setup(shouldShowWebshare = true): void {
    spectator = createComponent({
      providers: [
        mockProvider(LicenseService, {
          shouldShowWebshare$: of(shouldShowWebshare),
        }),
      ],
    });
  }

  beforeEach(() => {
    // TODO: Workaround for https://github.com/help-me-mom/ng-mocks/issues/8634
    // ng-mocks does not initialize signal-based viewChild queries on mocked components.
    MockInstance(SmbCardComponent, 'configForm', signal(undefined));
    MockInstance(NfsCardComponent, 'configForm', signal(undefined));
    MockInstance(IscsiCardComponent, 'configForm', signal(undefined));
    MockInstance(NvmeOfCardComponent, 'configForm', signal(undefined));
    MockInstance(WebShareCardComponent, 'configForm', signal(undefined));
  });

  it('shows cards for each share type', () => {
    setup();

    expect(spectator.query(SmbCardComponent)).toExist();
    expect(spectator.query(NfsCardComponent)).toExist();
    expect(spectator.query(IscsiCardComponent)).toExist();
    expect(spectator.query(NvmeOfCardComponent)).toExist();
    expect(spectator.query(WebShareCardComponent)).toExist();
  });

  it('hides WebShare card on enterprise systems', () => {
    setup(false);

    expect(spectator.query(WebShareCardComponent)).not.toExist();
  });
});
