import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnDialogHarness } from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import {
  VolumeMountsDialog,
} from 'app/pages/apps/components/installed-apps/app-workloads-card/volume-mounts-dialog/volume-mounts-dialog.component';

describe('VolumeMountsDialogComponent', () => {
  let spectator: Spectator<VolumeMountsDialog>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: VolumeMountsDialog,
    imports: [
      MockComponent(
        FormActionsComponent,
      ),
    ],
    providers: [
      mockProvider(DialogRef),
      {
        provide: DIALOG_DATA,
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
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows dialog header', async () => {
    const dialog = await loader.getHarness(TnDialogHarness);
    expect(await dialog.getTitle()).toBe('netdata Volume Mounts');
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
