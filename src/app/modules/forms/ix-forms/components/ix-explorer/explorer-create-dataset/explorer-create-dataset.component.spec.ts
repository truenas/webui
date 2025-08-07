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
    expect(await createButton.isDisabled()).toBeFalsy();

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
    expect(await createButton.isDisabled()).toBeTruthy();
  });

  it('disables Create Dataset button when no mountpoint is selected', async () => {
    // Simulate selection of non-mountpoint
    fakeExplorer.lastSelectedNode.set(createMockTreeNode({
      isMountpoint: false,
      path: '/mnt/test',
    }) as TreeNode<ExplorerNodeData>);
    spectator.detectChanges();

    const createButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create Dataset' }));
    expect(await createButton.isDisabled()).toBeTruthy();
  });
});
