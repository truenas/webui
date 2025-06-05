import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { TreeModule, TreeComponent, TreeModel } from '@bugsplat/angular-tree-component';
import { createHostFactory, mockProvider, SpectatorHost } from '@ngneat/spectator/jest';
import { MockInstance, MockModule } from 'ng-mocks';
import { of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { Dataset } from 'app/interfaces/dataset.interface';
import { CreateDatasetDialog } from 'app/modules/forms/ix-forms/components/ix-explorer/create-dataset-dialog/create-dataset-dialog.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxExplorerCreateDatasetComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/create-dataset/create-dataset.component';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';

describe('IxExplorerCreateDatasetComponent', () => {
  const mockTreeModel = {
    selectedLeafNodeIds: {},
    get selectedLeafNodes(): unknown[] { return []; },
    setState(newState: { selectedLeafNodeIds: { [k: string]: boolean } }) { this.selectedLeafNodeIds = newState.selectedLeafNodeIds; },
    getState() { return { selectedLeafNodeIds: this.selectedLeafNodeIds }; },
    update() {},
  } as TreeModel;
  MockInstance(TreeComponent, 'treeModel', mockTreeModel);

  const nodeProvider = jest.fn(() => of([]));

  const createHost = createHostFactory({
    component: IxExplorerComponent,
    declarations: [IxExplorerCreateDatasetComponent],
    imports: [ReactiveFormsModule, TreeModule, MockModule(TreeModule)],
    providers: [
      mockAuth(),
      mockProvider(CreateDatasetDialog),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({ afterClosed: () => of({ mountpoint: '/mnt/new_dataset' } as Dataset) })),
      }),
    ],
  });

  let spectator: SpectatorHost<IxExplorerComponent>;
  let loader: HarnessLoader;
  const formControl = new FormControl<string>('');

  beforeEach(() => {
    spectator = createHost(`<ix-explorer [formControl]="formControl" [nodeProvider]="nodeProvider">
      <ix-explorer-create-dataset></ix-explorer-create-dataset>
    </ix-explorer>`, {
      hostProps: { formControl, nodeProvider },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('opens create dataset dialog when button clicked', async () => {
    formControl.setValue('/mnt/pool');
    spectator.component.tree().treeModel = { ...mockTreeModel, selectedLeafNodes: [{ data: { isMountpoint: true }, expand: jest.fn() }] } as TreeModel;
    spectator.detectComponentChanges();

    const button = await loader.getHarness(MatButtonHarness.with({ selector: 'button.create-dataset-btn' }));
    await button.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(CreateDatasetDialog, {
      data: { parentId: 'pool', dataset: {} },
    });
    expect(formControl.value).toBe('/mnt/new_dataset');
  });
});
