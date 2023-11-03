import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { IscsiService } from 'app/services/iscsi.service';
import { IscsiComponent } from './iscsi.component';

describe('IscsiComponent', () => {
  let spectator: Spectator<IscsiComponent>;

  const createComponent = createComponentFactory({
    component: IscsiComponent,
    imports: [],
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
