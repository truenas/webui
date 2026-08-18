import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { ContainerStatus } from 'app/enums/container.enum';
import { Container } from 'app/interfaces/container.interface';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import {
  DeleteContainerDialog,
} from 'app/pages/containers/components/common/delete-container-dialog/delete-container-dialog.component';
import { fakeContainer } from 'app/pages/containers/utils/fake-container.utils';

describe('DeleteContainerDialog', () => {
  let spectator: Spectator<DeleteContainerDialog>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: DeleteContainerDialog,
    providers: [
      mockProvider(MatDialogRef, {
        close: jest.fn(),
      }),
    ],
  });

  function setupTest(container: Container): void {
    spectator = createComponent({
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: container },
      ],
    });

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  async function confirm(): Promise<void> {
    const confirmCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Confirm' }));
    await confirmCheckbox.setValue(true);
  }

  it('shows the container name in the dialog', () => {
    setupTest(fakeContainer({ name: 'Demo' }));

    expect(spectator.query('h1')).toHaveText('Delete Container');
    expect(spectator.query('.delete-message')).toHaveText('Delete Demo?');
  });

  it('keeps Delete disabled until the deletion is confirmed', async () => {
    setupTest(fakeContainer());

    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    expect(await deleteButton.isDisabled()).toBe(true);

    await confirm();
    expect(await deleteButton.isDisabled()).toBe(false);
  });

  it('closes with both options unset for a stopped container', async () => {
    setupTest(fakeContainer({ status: { state: ContainerStatus.Stopped, pid: null, domain_state: null } }));

    await confirm();
    await (await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }))).click();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith({ force: false, recursive: false });
  });

  it('closes with the recursive option when child datasets and snapshots are to be destroyed', async () => {
    setupTest(fakeContainer());

    const recursiveCheckbox = await loader.getHarness(
      IxCheckboxHarness.with({ label: 'Delete child datasets, snapshots and clones' }),
    );
    await recursiveCheckbox.setValue(true);
    await confirm();
    await (await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }))).click();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith({ force: false, recursive: true });
  });

  it('warns about the irreversible destruction once recursive is checked', async () => {
    setupTest(fakeContainer());

    expect(spectator.query('.recursive-warning')).toBeNull();

    const recursiveCheckbox = await loader.getHarness(
      IxCheckboxHarness.with({ label: 'Delete child datasets, snapshots and clones' }),
    );
    await recursiveCheckbox.setValue(true);

    expect(spectator.query('.recursive-warning')).toBeTruthy();
  });

  it('does not delete on implicit form submission while the deletion is unconfirmed', () => {
    setupTest(fakeContainer());

    spectator.dispatchFakeEvent('form', 'submit');

    expect(spectator.inject(MatDialogRef).close).not.toHaveBeenCalled();
  });

  it.each([ContainerStatus.Running, ContainerStatus.Suspended])(
    'forces the stop for a %s container, because middleware refuses to delete it otherwise',
    async (state) => {
      setupTest(fakeContainer({ status: { state, pid: null, domain_state: null } }));

      const forceCheckbox = await loader.getHarness(
        IxCheckboxHarness.with({ label: 'Stop container before deleting' }),
      );
      expect(await forceCheckbox.getValue()).toBe(true);
      expect(await forceCheckbox.isDisabled()).toBe(true);

      await confirm();
      await (await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }))).click();

      expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith({ force: true, recursive: false });
    },
  );
});
