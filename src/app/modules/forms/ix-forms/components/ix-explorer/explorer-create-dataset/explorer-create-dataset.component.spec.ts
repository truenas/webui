import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { FormControl, NgControl } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import {
  createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { ExplorerNodeData, TreeNode } from 'app/interfaces/tree-node.interface';
import {
  CreateDatasetDialog,
} from 'app/modules/forms/ix-forms/components/ix-explorer/create-dataset-dialog/create-dataset-dialog.component';
import {
  ExplorerCreateDatasetComponent,
} from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-dataset/explorer-create-dataset.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';

describe('ExplorerCreateDatasetComponent', () => {
  let spectator: Spectator<ExplorerCreateDatasetComponent>;

  // Create a minimal mock TreeNode to avoid 'any' usage
  const createMockTreeNode = (data: Partial<ExplorerNodeData>): Partial<TreeNode<ExplorerNodeData>> => ({
    data: {
      isMountpoint: true,
      path: '/mnt/test',
      name: 'test',
      type: ExplorerNodeType.Directory,
      hasChildren: false,
      ...data,
    },
  });

  const fakeExplorer = {
    isDisabled: signal(false),

    lastSelectedNode: signal(createMockTreeNode({
      isMountpoint: true,
      path: '/mnt/test',
    }) as TreeNode<ExplorerNodeData>),

    refreshNode: jest.fn(),
    refreshNodeByPath: jest.fn(),
  } as unknown as IxExplorerComponent;

  const fakeControl = {
    valueChanges: of('/mnt/test'),
    control: new FormControl('/mnt/test'),
  };

  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: ExplorerCreateDatasetComponent,
    imports: [
      MockComponent(CreateDatasetDialog),
    ],
    providers: [
      mockAuth(),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of({ mountpoint: '/mnt/test' }),
        })),
      }),
      {
        provide: NgControl,
        useValue: fakeControl,
      },
      {
        provide: IxExplorerComponent,
        useValue: fakeExplorer,
      },
    ],
  });

  const datasetProps = { comments: 'test' };

  beforeEach(() => {
    jest.clearAllMocks();

    fakeExplorer.lastSelectedNode.set(createMockTreeNode({
      isMountpoint: true,
      path: '/mnt/test',
    }) as TreeNode<ExplorerNodeData>);

    spectator = createComponent({
      props: {
        datasetProperties: datasetProps,
      },
    });

    jest.spyOn(fakeControl.control, 'setValue');

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);

    fakeControl.control.setValue('/mnt/test');
  });

  it('opens CreateDatasetDialog when Create Dataset button is pressed', async () => {
    const createButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create Dataset' }));
    expect(await createButton.isDisabled()).toBe(false);

    await createButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(CreateDatasetDialog, {
      data: {
        parentId: 'test',
        dataset: datasetProps,
      },
    });

    expect(fakeExplorer.refreshNode).toHaveBeenCalled();
    expect(fakeControl.control.setValue).toHaveBeenCalledWith('/mnt/test');
  });

  it('disables Create Dataset button when path does not match selected node', async () => {
    // Simulate user typing a different path than what's selected
    fakeControl.control.setValue('/mnt/error');
    spectator.detectChanges();

    const createButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create Dataset' }));
    expect(await createButton.isDisabled()).toBe(true);
  });

  it('disables Create Dataset button when no mountpoint is selected', async () => {
    // Simulate selection of non-mountpoint
    fakeExplorer.lastSelectedNode.set(createMockTreeNode({
      isMountpoint: false,
      path: '/mnt/test',
    }) as TreeNode<ExplorerNodeData>);
    spectator.detectChanges();

    const createButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create Dataset' }));
    expect(await createButton.isDisabled()).toBe(true);
  });

  it('disables Create Dataset button when selected path is outside /mnt/ (e.g. zvol device path)', async () => {
    // Reproduces the rejected "Parent dataset /dev/zvol/<pool> not found" case: the file
    // node provider can mark zvol device paths as mountpoints, but pool.dataset.create
    // only accepts real dataset names ("tank", "tank/foo"), not device paths.
    fakeExplorer.lastSelectedNode.set(createMockTreeNode({
      isMountpoint: true,
      path: '/dev/zvol/dozer',
    }) as TreeNode<ExplorerNodeData>);
    fakeControl.control.setValue('/dev/zvol/dozer');
    spectator.detectChanges();

    const createButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create Dataset' }));
    expect(await createButton.isDisabled()).toBeTruthy();
  });

  describe('multi-select mode', () => {
    it('enables Create Dataset button when exactly one item is selected, even after lastSelectedNode is cleared', async () => {
      // The explorer clears lastSelectedNode when the most recently clicked node is deselected
      // (e.g. user picked A then B, then unchecks B). The form value still has [A], so the
      // button must be enabled.
      fakeExplorer.lastSelectedNode.set(null);
      fakeControl.control.setValue(['/mnt/test']);
      spectator.detectChanges();

      const createButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create Dataset' }));
      expect(await createButton.isDisabled()).toBe(false);
    });

    it('disables Create Dataset button when multiple items are selected', async () => {
      fakeControl.control.setValue(['/mnt/test', '/mnt/other']);
      spectator.detectChanges();

      const createButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create Dataset' }));
      expect(await createButton.isDisabled()).toBe(true);
    });

    it('disables Create Dataset button when no items are selected', async () => {
      fakeControl.control.setValue([]);
      spectator.detectChanges();

      const createButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create Dataset' }));
      expect(await createButton.isDisabled()).toBe(true);
    });

    it('opens dialog with parentId derived from array form value, refreshes the parent node, and replaces it in the array', async () => {
      // In multi-select mode the explorer clears lastSelectedNode after deselect. Verify the
      // parentId is still derived from the form value, the parent tree node is refreshed by
      // path, and setValue replaces the parent path with the new dataset's mountpoint without
      // clobbering the array.
      fakeExplorer.lastSelectedNode.set(null);
      fakeControl.control.setValue(['/mnt/test']);
      spectator.detectChanges();

      spectator.inject<MatDialog>(MatDialog).open = jest.fn(() => ({
        afterClosed: () => of({ mountpoint: '/mnt/test/new' }),
      })) as unknown as MatDialog['open'];

      const createButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create Dataset' }));
      await createButton.click();

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(CreateDatasetDialog, {
        data: {
          parentId: 'test',
          dataset: datasetProps,
        },
      });

      expect(fakeExplorer.refreshNodeByPath).toHaveBeenCalledWith('/mnt/test');
      expect(fakeExplorer.refreshNode).not.toHaveBeenCalled();
      expect(fakeControl.control.setValue).toHaveBeenCalledWith(['/mnt/test/new']);
    });
  });
});
