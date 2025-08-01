import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { NvmeOfNamespaceType } from 'app/enums/nvme-of.enum';
import { NvmeOfNamespace } from 'app/interfaces/nvme-of.interface';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import { DeleteNamespaceDialogComponent } from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-namespaces-card/delete-namespace-dialog/delete-namespace-dialog.component';

describe('DeleteNamespaceDialogComponent', () => {
  let spectator: Spectator<DeleteNamespaceDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: DeleteNamespaceDialogComponent,
    imports: [ReactiveFormsModule],
    providers: [
      mockProvider(MatDialogRef),
      mockApi([mockCall('nvmet.namespace.delete')]),
    ],
  });

  function initComponent(namespace: NvmeOfNamespace): void {
    spectator = createComponent({
      providers: [{
        provide: MAT_DIALOG_DATA,
        useValue: namespace,
      }],
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  it('deletes zvol namespace without remove flag', async () => {
    initComponent({
      id: 1,
      device_type: NvmeOfNamespaceType.Zvol,
      device_path: '/dev/zvol/z1',
    } as NvmeOfNamespace);

    const message = spectator.query('.message');
    expect(message).toHaveText('Are you sure you want to delete this namespace?');
    expect(message).toHaveText('Underlying Zvol will not be deleted.');

    expect(await loader.getHarnessOrNull(IxCheckboxHarness)).toBeNull();

    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.namespace.delete', [1]);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
  });

  it('optionally deletes file namespace with remove flag when checkbox is checked', async () => {
    initComponent({
      id: 2,
      device_type: NvmeOfNamespaceType.File,
      device_path: '/mnt/file1',
    } as NvmeOfNamespace);

    const checkbox = await loader.getHarness(IxCheckboxHarness);
    expect(await checkbox.getLabelText()).toBe('Also delete the underlying file – /mnt/file1');
    await checkbox.setValue(true);

    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.namespace.delete', [2, { remove: true }]);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
  });
});
