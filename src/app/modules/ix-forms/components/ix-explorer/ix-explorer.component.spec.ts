import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { EventEmitter } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { TreeComponent as BaseTreeComponent, TreeModel } from '@bugsplat/angular-tree-component';
import { IDTypeDictionary } from '@bugsplat/angular-tree-component/lib/defs/api';
import { FormControl } from '@ngneat/reactive-forms';
import { createHostFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent, MockInstance } from 'ng-mocks';
import { of } from 'rxjs';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { Dataset, DatasetCreate } from 'app/interfaces/dataset.interface';
import { IxErrorsComponent } from 'app/modules/ix-forms/components/ix-errors/ix-errors.component';
import { CreateDatasetDialogComponent } from 'app/modules/ix-forms/components/ix-explorer/create-dataset-dialog/create-dataset-dialog.component';
import { IxExplorerComponent } from 'app/modules/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxLabelComponent } from 'app/modules/ix-forms/components/ix-label/ix-label.component';

/**
 * Provides better typing.
 */
class TreeComponent extends BaseTreeComponent {
  select: EventEmitter<unknown>;
  deselect: EventEmitter<unknown>;
}

describe('IxExplorerComponent', () => {
  const mockTreeMock = {
    selectedLeafNodeIds: {},
    get selectedLeafNodes(): unknown[] {
      return [];
    },
    setState(newState: { selectedLeafNodeIds: IDTypeDictionary }) {
      this.selectedLeafNodeIds = newState.selectedLeafNodeIds;
    },
    getState() {
      return {
        selectedLeafNodeIds: this.selectedLeafNodeIds,
      };
    },
    update() {},
  } as TreeModel;
  jest.spyOn(mockTreeMock, 'setState');
  jest.spyOn(mockTreeMock, 'getState');
  MockInstance(TreeComponent, 'treeModel', mockTreeMock);

  const fakeNodeProvider = jest.fn(() => of([]));

  let spectator: Spectator<IxExplorerComponent>;
  let loader: HarnessLoader;
  const formControl = new FormControl<string | string[]>();
  const createHost = createHostFactory({
    component: IxExplorerComponent,
    imports: [
      ReactiveFormsModule,
      FormsModule,
    ],
    declarations: [
      MockComponent(IxErrorsComponent),
      MockComponent(IxLabelComponent),
      MockComponent(TreeComponent),
    ],
    providers: [
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of({ name: 'new_dataset' } as Dataset),
        })),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createHost('<ix-explorer [formControl]="formControl"></ix-explorer>', {
      hostProps: { formControl },
      props: {
        nodeProvider: fakeNodeProvider,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    (mockTreeMock.setState as unknown as jest.SpiedFunction<TreeModel['setState']>).mockClear();
    (mockTreeMock.getState as unknown as jest.SpiedFunction<TreeModel['getState']>).mockClear();
  });

  describe('rendering – tree', () => {
    it('renders a TreeComponent with a root nodes based on `root` attribute', () => {
      const tree = spectator.query(TreeComponent);
      expect(tree.nodes).toEqual([
        {
          hasChildren: true,
          name: mntPath,
          path: mntPath,
          type: ExplorerNodeType.Directory,
          isMountpoint: true,
        },
      ]);
    });

    it('passes correct options to TreeComponent', () => {
      const tree = spectator.query(TreeComponent);
      expect(tree.options).toMatchObject({
        displayField: 'name',
        idField: 'path',
        useTriState: false,
      });
    });

    it('calls nodeProvider when getChildren from TreeComponent options is called', () => {
      const tree = spectator.query(TreeComponent);
      tree.options.getChildren({ path: mntPath });

      expect(fakeNodeProvider).toHaveBeenCalledWith({ path: mntPath });
    });
  });

  describe('rendering – other elements', () => {
    it('renders a hint when it is provided', () => {
      spectator.setInput('hint', 'Please select a directory starting with an A');

      expect(spectator.query('mat-hint'))
        .toHaveExactText('Please select a directory starting with an A');
    });

    it('renders a label and passes properties to it', () => {
      spectator.setInput('label', 'Select dataset');
      spectator.setInput('required', true);
      spectator.setInput('tooltip', 'Enter the location of the system.');

      const label = spectator.query(IxLabelComponent);
      expect(label).toExist();
      expect(label.label).toBe('Select dataset');
      expect(label.required).toBe(true);
      expect(label.tooltip).toBe('Enter the location of the system.');
    });
  });

  describe('form control - multiple=false', () => {
    it('shows value provided in form control', () => {
      formControl.setValue('/mnt/whatever');
      spectator.detectComponentChanges();

      expect(spectator.query('input')).toHaveValue('/mnt/whatever');
    });

    it('selects a node matching form control value', () => {
      formControl.setValue('/mnt/place');
      spectator.detectComponentChanges();

      expect(mockTreeMock.setState).toHaveBeenCalledWith({ selectedLeafNodeIds: { '/mnt/place': true } });
    });

    it('updates form control when user types in new value in the input', () => {
      spectator.typeInElement('/mnt/new', 'input');
      spectator.dispatchFakeEvent('input', 'change');

      expect(formControl.value).toBe('/mnt/new');
    });

    it('updates form control when user selects a node', () => {
      const tree = spectator.query(TreeComponent);
      tree.select.emit({ node: { id: '/mnt/new' } });

      expect(mockTreeMock.setState).toHaveBeenCalledWith({ selectedLeafNodeIds: { '/mnt/new': true } });
      expect(formControl.value).toBe('/mnt/new');
    });

    it('updates form control when user deselects a node', () => {
      const tree = spectator.query(TreeComponent);
      tree.select.emit({ node: { id: '/mnt/new' } });
      tree.deselect.emit({ node: { id: '/mnt/new' } });

      expect(mockTreeMock.setState).toHaveBeenLastCalledWith({ selectedLeafNodeIds: {} });
      expect(formControl.value).toBeUndefined();
    });
  });

  describe('form control - multiple=true', () => {
    beforeEach(() => spectator.setInput('multiple', true));

    it('shows values provided in form control', () => {
      formControl.setValue(['/mnt/place1', '/mnt/place2']);
      spectator.detectComponentChanges();

      expect(spectator.query('input')).toHaveValue('/mnt/place1,/mnt/place2');
    });

    it('selects nodes matching form control value', () => {
      formControl.setValue(['/mnt/place1', '/mnt/place2']);
      spectator.detectComponentChanges();

      expect(mockTreeMock.setState).toHaveBeenCalledWith({
        selectedLeafNodeIds: { '/mnt/place1': true, '/mnt/place2': true },
      });
    });

    it('updates form control value when user writes multiple entries in the input', () => {
      spectator.typeInElement('/mnt/new1,/mnt/new2', 'input');
      spectator.dispatchFakeEvent('input', 'change');

      expect(mockTreeMock.setState).toHaveBeenCalledWith({
        selectedLeafNodeIds: {
          '/mnt/new1': true,
          '/mnt/new2': true,
        },
      });
      expect(formControl.value).toEqual(['/mnt/new1', '/mnt/new2']);
    });

    it('updates form control when user selects multiple nodes', () => {
      const tree = spectator.query(TreeComponent);
      tree.select.emit({ node: { id: '/mnt/new1' } });
      tree.select.emit({ node: { id: '/mnt/new2' } });

      expect(mockTreeMock.setState).toHaveBeenCalledWith({
        selectedLeafNodeIds: {
          '/mnt/new1': true,
          '/mnt/new2': true,
        },
      });
      expect(formControl.value).toEqual(['/mnt/new1', '/mnt/new2']);
    });

    it('updates form control when user deselects multiple nodes', () => {
      const tree = spectator.query(TreeComponent);
      tree.select.emit({ node: { id: '/mnt/new1' } });
      tree.select.emit({ node: { id: '/mnt/new2' } });
      tree.deselect.emit({ node: { id: '/mnt/new1' } });

      expect(mockTreeMock.setState).toHaveBeenLastCalledWith({
        selectedLeafNodeIds: { '/mnt/new2': true },
      });
      expect(formControl.value).toEqual(['/mnt/new2']);
    });
  });

  describe('creating new dataset', () => {
    it('hides Create Dataset buttton when canCreateDataset is false', async () => {
      spectator.setInput('canCreateDataset', false);

      const createDatasetButton = await loader.getHarnessOrNull(MatButtonHarness.with({ text: 'Create Dataset' }));
      expect(createDatasetButton).toBeNull();
    });

    it('disables Create Dataset button when node is unselected', async () => {
      spectator.setInput('canCreateDataset', true);
      formControl.setValue([]);

      spectator.component.tree.treeModel = {
        ...mockTreeMock,
        selectedLeafNodes: [{ data: { isMountpoint: true } }],
      } as TreeModel;

      const createDatasetButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create Dataset' }));
      expect(await createDatasetButton.isDisabled()).toBeTruthy();
    });

    it('disables Create Dataset button when node is not mountpoint', async () => {
      spectator.setInput('canCreateDataset', true);
      formControl.setValue('/mnt/place');

      spectator.component.tree.treeModel = {
        ...mockTreeMock,
        selectedLeafNodes: [{ data: { isMountpoint: false } }],
      } as TreeModel;

      const createDatasetButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create Dataset' }));
      expect(await createDatasetButton.isDisabled()).toBeTruthy();
    });

    it('disables Create Dataset button when form control is disabled', async () => {
      spectator.setInput('canCreateDataset', true);
      spectator.setInput('createDatasetProps', {});
      formControl.setValue('/mnt/place');

      spectator.component.tree.treeModel = {
        ...mockTreeMock,
        selectedLeafNodes: [{ data: { isMountpoint: true } }],
      } as TreeModel;

      formControl.disable();
      spectator.detectComponentChanges();

      const createDatasetButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create Dataset' }));
      expect(await createDatasetButton.isDisabled()).toBeTruthy();
    });

    it('opens a creating dataset dialog when Create Dataset button is pressed', async () => {
      const createDatasetProps: Omit<DatasetCreate, 'name'> = { encryption: true };

      spectator.setInput('canCreateDataset', true);
      spectator.setInput('createDatasetProps', createDatasetProps);
      formControl.setValue('/mnt/place');
      formControl.enable();

      spectator.component.tree.treeModel = {
        ...mockTreeMock,
        selectedLeafNodes: [{
          data: { isMountpoint: true },
          expand: jest.fn(),
        }],
      } as TreeModel;

      const createDatasetButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create Dataset' }));
      expect(await createDatasetButton.isDisabled()).toBeFalsy();

      await createDatasetButton.click();

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(CreateDatasetDialogComponent, {
        data: {
          dataset: createDatasetProps,
          parentId: 'place',
        },
      });

      expect(formControl.value).toBe('/mnt/new_dataset');
    });
  });

  describe('disabling', () => {
    it('disables input and explorer when form control is disabled', () => {
      formControl.disable();
      spectator.detectComponentChanges();

      expect(spectator.query('input')).toBeDisabled();
      expect(spectator.query('.tree-container')).toHaveClass('disabled');
    });
  });
});
