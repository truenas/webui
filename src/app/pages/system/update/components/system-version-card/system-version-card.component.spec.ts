import { ReactiveFormsModule } from '@angular/forms';
import {
  createComponentFactory,
  Spectator,
} from '@ngneat/spectator/jest';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { SystemVersionCardComponent } from 'app/pages/system/update/components/system-version-card/system-version-card.component';

describe('SystemVersionCardComponent', () => {
  let spectator: Spectator<SystemVersionCardComponent>;

  const createComponent = createComponentFactory({
    component: SystemVersionCardComponent,
    imports: [

      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('webui.main.dashboard.sys_info', {
          version: '25.10.0-MASTER-20250126-184805',
          codename: 'Goldeye',
          remote_info: {
            version: '25.10.0-MASTER-20250127-166341',
            codename: 'Goldeye',
          },
        } as SystemInfo),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('show current version for local node', () => {
    const version = spectator.query('.current-version');
    expect(version).toHaveText('Current version: 25.10.0-MASTER-20250126-184805 - Goldeye');
  });

  it('show current version for standby node', () => {
    const version = spectator.query('.current-version.remote');
    expect(version).toHaveText('Current version (standby node): 25.10.0-MASTER-20250127-166341 - Goldeye');
  });
});
