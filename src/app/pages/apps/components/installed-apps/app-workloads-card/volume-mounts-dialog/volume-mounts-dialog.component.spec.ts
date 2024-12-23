import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import {
  VolumeMountsDialogComponent,
} from 'app/pages/apps/components/installed-apps/app-workloads-card/volume-mounts-dialog/volume-mounts-dialog.component';

describe('VolumeMountsDialogComponent', () => {
  let spectator: Spectator<VolumeMountsDialogComponent>;
  const createComponent = createComponentFactory({
    component: VolumeMountsDialogComponent,
    imports: [
      MockComponent(
        FormActionsComponent,
      ),
    ],
    providers: [
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          service_name: 'netdata',
          volume_mounts: [
            {
              source: '/proc',
              destination: '/host/proc',
              mode: '',
              type: 'bind',
            },
            {
              source: '/mnt/.ix-apps/docker/volumes/abc',
              destination: '/tmp',
              mode: 'z',
              type: 'volume',
            },
          ],
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows dialog header', () => {
    expect(spectator.query('h1')).toHaveText('netdata Volume Mounts');
  });

  it('shows a table with information about volume mounts', () => {
    const cells = spectator.queryAll('tr').map((row: HTMLElement) => {
      return Array.from(row.querySelectorAll('td, th')).map((cell) => cell.textContent!.trim());
    });

    expect(cells).toEqual([
      ['Type', 'Source', 'Destination', 'Mode'],
      ['bind', '/proc', '/host/proc', ''],
      ['volume', '/mnt/.ix-apps/docker/volumes/abc', '/tmp', 'z'],
    ]);
  });
});
