import { MatTabsModule } from '@angular/material/tabs';
import { Spectator } from '@ngneat/spectator';
import { createRoutingFactory } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { TargetGlobalConfigurationComponent } from 'app/pages/sharing/iscsi/target-global-configuration/target-global-configuration.component';
import { IscsiService } from 'app/services/iscsi.service';
import { IscsiComponent } from './iscsi.component';

describe('IscsiComponent', () => {
  let spectator: Spectator<IscsiComponent>;

  const createComponent = createRoutingFactory({
    component: IscsiComponent,
    declarations: [MockComponents(TargetGlobalConfigurationComponent)],
    imports: [MatTabsModule],
    providers: [IscsiService],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should have correct initial activeTab', () => {
    expect(spectator.component.activeTab).toBe('configuration');
  });

  it('should have correct navLinks', () => {
    const expectedNavLinks = [
      {
        label: 'Target Global Configuration',
        path: '/sharing/iscsi/configuration',
      },
      {
        label: 'Portals',
        path: '/sharing/iscsi/portals',
      },
      {
        label: 'Initiators Groups',
        path: '/sharing/iscsi/initiator',
      },
      {
        label: 'Authorized Access',
        path: '/sharing/iscsi/auth',
      },
      {
        label: 'Targets',
        path: '/sharing/iscsi/target',
      },
      {
        label: 'Extents',
        path: '/sharing/iscsi/extent',
      },
      {
        label: 'Associated Targets',
        path: '/sharing/iscsi/associatedtarget',
      },
    ];
    expect(spectator.component.navLinks).toEqual(expectedNavLinks);
  });
});
