import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnCheckboxHarness, TnDialogHarness } from '@truenas/ui-components';
import { ContainerStatus } from 'app/enums/container.enum';
import { Container } from 'app/interfaces/container.interface';
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
      mockProvider(DialogRef),
    ],
  });

  function setupTest(container: Container): void {
    spectator = createComponent({
      providers: [
        { provide: DIALOG_DATA, useValue: container },
      ],
    });

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  async function confirm(): Promise<void> {
    const confirmCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Confirm' }));
    await confirmCheckbox.check();
  }

  it('shows the container name in the dialog', async () => {
    setupTest(fakeContainer({ name: 'Demo' }));

    const dialog = await loader.getHarness(TnDialogHarness);
    expect(await dialog.getTitle()).toBe('Delete Container');
    expect(spectator.query('.delete-message')).toHaveText('Delete Demo?');
  });

  it('keeps Delete disabled until the deletion is confirmed', async () => {
    setupTest(fakeContainer());

    const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: 'Delete' }));
    expect(await deleteButton.isDisabled()).toBe(true);

    await confirm();
    expect(await deleteButton.isDisabled()).toBe(false);
  });

  it('closes with both options unset for a stopped container', async () => {
    setupTest(fakeContainer({ status: { state: ContainerStatus.Stopped, pid: null, domain_state: null } }));

    await confirm();
    await (await loader.getHarness(TnButtonHarness.with({ label: 'Delete' }))).click();

    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith({ force: false, recursive: false });
  });

  it('closes with the recursive option when child datasets and snapshots are to be destroyed', async () => {
    setupTest(fakeContainer());

    const recursiveCheckbox = await loader.getHarness(
      TnCheckboxHarness.with({ label: 'Delete child datasets, snapshots and clones' }),
    );
    await recursiveCheckbox.check();
    await confirm();
    await (await loader.getHarness(TnButtonHarness.with({ label: 'Delete' }))).click();

    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith({ force: false, recursive: true });
  });

  it('warns about the irreversible destruction once recursive is checked', async () => {
    setupTest(fakeContainer());

    expect(spectator.query('tn-banner')).toBeNull();

    const recursiveCheckbox = await loader.getHarness(
      TnCheckboxHarness.with({ label: 'Delete child datasets, snapshots and clones' }),
    );
    await recursiveCheckbox.check();

    expect(spectator.query('tn-banner')).toBeTruthy();
  });

  it.each([ContainerStatus.Running, ContainerStatus.Suspended])(
    'preselects force for a %s container, because middleware refuses to delete it otherwise',
    async (state) => {
      setupTest(fakeContainer({ status: { state, pid: null, domain_state: null } }));

      const forceCheckbox = await loader.getHarness(
        TnCheckboxHarness.with({ label: 'Stop container before deleting' }),
      );
      expect(await forceCheckbox.isChecked()).toBe(true);

      await confirm();
      await (await loader.getHarness(TnButtonHarness.with({ label: 'Delete' }))).click();

      expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith({ force: true, recursive: false });
    },
  );
});
