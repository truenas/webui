import { EventEmitter } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  ITreeState,
  TreeComponent,
  TreeModel,
  TreeModule,
} from '@bugsplat/angular-tree-component';
import { FormControl } from '@ngneat/reactive-forms';
import { SpectatorHost } from '@ngneat/spectator';
import { createHostFactory } from '@ngneat/spectator/jest';
import { MockInstance, MockModule } from 'ng-mocks';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';

describe('IxExplorerComponent', () => {
  const mockNode = {
    id: '/mnt/test',
    data: { path: '/mnt/test', name: 'test', type: ExplorerNodeType.Directory },
    loadNodeChildren: jest.fn().mockResolvedValue([]),
    setIsExpanded: jest.fn(),
    expand: jest.fn(),
  };

  const mockTreeMock = {
    selectedLeafNodeIds: {} as Record<string, boolean>,
    get selectedLeafNodes(): unknown[] {
      return [];
    },
    setState(newState: ITreeState) {
      const typedMockTreeMock = mockTreeMock as { selectedLeafNodeIds: Record<string, boolean> };
      typedMockTreeMock.selectedLeafNodeIds = newState.selectedLeafNodeIds;
    },
    getState() {
      const typedMockTreeMock = mockTreeMock as { selectedLeafNodeIds: Record<string, boolean> };
      return {
        selectedLeafNodeIds: typedMockTreeMock.selectedLeafNodeIds,
      };
    },
    update() {},
    getNodeByPath: jest.fn().mockReturnValue(mockNode),
  } as unknown as TreeModel;
  jest.spyOn(mockTreeMock, 'setState');
  jest.spyOn(mockTreeMock, 'getState');
  MockInstance(TreeComponent, 'treeModel', mockTreeMock);

  const fakeNodeProvider = jest.fn(() => of([]));

  let spectator: SpectatorHost<IxExplorerComponent>;
  const formControl = new FormControl<string | string[]>();
  const createHost = createHostFactory({
    component: IxExplorerComponent,
    imports: [
      ReactiveFormsModule,
      TreeModule,
      MockModule(TreeModule),
    ],
    providers: [
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createHost(
      `<ix-explorer
        [formControl]="formControl"
        [nodeProvider]="nodeProvider"
        [label]="label"
        [hint]="hint"
        [required]="required"
        [tooltip]="tooltip"
        [rootNodes]="[root]"
        [multiple]="multiple"
      ></ix-explorer>`,
      {
        hostProps: {
          formControl,
          nodeProvider: fakeNodeProvider,
          label: undefined,
          hint: undefined,
          required: false,
          tooltip: undefined,
          root: {
            hasChildren: true,
            name: mntPath,
            path: mntPath,
            type: ExplorerNodeType.Directory,
          },
          multiple: false,
        },
      },
    );
    (mockTreeMock.setState as jest.Mock).mockClear();
    (mockTreeMock.getState as jest.Mock).mockClear();
    (mockTreeMock.getNodeByPath as jest.Mock).mockClear();
    (mockNode.loadNodeChildren as jest.Mock).mockClear();
    (mockNode.setIsExpanded as jest.Mock).mockClear();
    (mockNode.expand as jest.Mock).mockClear();
  });

  describe('rendering – tree', () => {
    it('renders a TreeComponent with a root nodes based on `root` attribute', () => {
      const tree = spectator.query(TreeComponent)!;
      expect(tree.nodes).toEqual([
        {
          hasChildren: true,
          name: mntPath,
          path: mntPath,
          type: ExplorerNodeType.Directory,
        },
      ]);
    });

    it('passes correct options to TreeComponent', () => {
      const tree = spectator.query(TreeComponent)!;
      expect(tree.options).toMatchObject({
        displayField: 'name',
        idField: 'path',
        useTriState: false,
      });
    });

    it('calls nodeProvider when getChildren from TreeComponent options is called', () => {
      const tree = spectator.query(TreeComponent)!;
      tree.options.getChildren!({ path: mntPath });

      expect(fakeNodeProvider).toHaveBeenCalledWith({ path: mntPath });
    });
  });

  describe('rendering – other elements', () => {
    it('renders a hint when it is provided', () => {
      spectator.setHostInput('hint', 'Please select a directory starting with an A');
      spectator.detectComponentChanges();

      expect(spectator.query('mat-hint'))
        .toHaveExactText('Please select a directory starting with an A');
    });

    it('renders a label and passes properties to it', () => {
      spectator.setHostInput('label', 'Select dataset');
      spectator.setHostInput('required', true);
      spectator.setHostInput('tooltip', 'Enter the location of the system.');
      spectator.detectComponentChanges();

      const label = spectator.query(IxLabelComponent)!;
      expect(label).toExist();
      expect(label.label()).toBe('Select dataset');
      expect(label.required()).toBe(true);
      expect(label.tooltip()).toBe('Enter the location of the system.');
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
      const tree = spectator.query(TreeComponent)!;
      (tree.select as EventEmitter<unknown>).emit({ node: { id: '/mnt/new' } });

      expect(mockTreeMock.setState).toHaveBeenCalledWith({ selectedLeafNodeIds: { '/mnt/new': true } });
      expect(formControl.value).toBe('/mnt/new');
    });

    it('updates form control when user deselects a node', () => {
      const tree = spectator.query(TreeComponent)!;
      (tree.select as EventEmitter<unknown>).emit({ node: { id: '/mnt/new' } });
      (tree.deselect as EventEmitter<unknown>).emit({ node: { id: '/mnt/new' } });

      expect(mockTreeMock.setState).toHaveBeenLastCalledWith({ selectedLeafNodeIds: {} });
      expect(formControl.value).toBeUndefined();
    });
  });

  describe('form control - multiple=true', () => {
    beforeEach(() => {
      spectator.setHostInput('multiple', true);
      spectator.detectComponentChanges();
    });

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
      const tree = spectator.query(TreeComponent)!;
      (tree.select as EventEmitter<unknown>).emit({ node: { id: '/mnt/new1' } });
      (tree.select as EventEmitter<unknown>).emit({ node: { id: '/mnt/new2' } });

      expect(mockTreeMock.setState).toHaveBeenCalledWith({
        selectedLeafNodeIds: {
          '/mnt/new1': true,
          '/mnt/new2': true,
        },
      });
      expect(formControl.value).toEqual(['/mnt/new1', '/mnt/new2']);
    });

    it('updates form control when user deselects multiple nodes', () => {
      const tree = spectator.query(TreeComponent)!;
      (tree.select as EventEmitter<unknown>).emit({ node: { id: '/mnt/new1' } });
      (tree.select as EventEmitter<unknown>).emit({ node: { id: '/mnt/new2' } });
      (tree.deselect as EventEmitter<unknown>).emit({ node: { id: '/mnt/new1' } });

      expect(mockTreeMock.setState).toHaveBeenLastCalledWith({
        selectedLeafNodeIds: { '/mnt/new2': true },
      });
      expect(formControl.value).toEqual(['/mnt/new2']);
    });
  });

  describe('disabling', () => {
    it('disables input and explorer when form control is disabled', () => {
      formControl.disable();
      spectator.detectComponentChanges();

      expect(spectator.query('input')).toBeDisabled();
      expect(spectator.query('.tree-container')).toHaveClass('disabled');
    });

    // TODO: Add test 'disables input when readonly is set to true on ix-explorer'
    // when overall tests for the component are working, after the following issue is solved
    // https://github.com/help-me-mom/ng-mocks/issues/10503
  });

  describe('expandTreeToPathNode', () => {
    it('expands tree and selects node when user types a path in input', async () => {
      const testPath = '/mnt/test';

      spectator.typeInElement(testPath, 'input');
      spectator.dispatchFakeEvent('input', 'change');

      await spectator.fixture.whenStable();
      spectator.detectComponentChanges();

      expect(mockTreeMock.getNodeByPath).toHaveBeenCalledWith(['/']);
      expect(mockTreeMock.getNodeByPath).toHaveBeenCalledWith(['/', '/mnt']);
      expect(mockTreeMock.getNodeByPath).toHaveBeenCalledWith(['/', '/mnt', '/mnt/test']);
      expect(mockNode.loadNodeChildren).toHaveBeenCalled();
      expect(mockNode.setIsExpanded).toHaveBeenCalledWith(true);
      expect(mockNode.expand).toHaveBeenCalled();
      expect(spectator.component.lastSelectedNode()).toBe(mockNode);
      expect(spectator.component.lastSelectedNode()?.id).toBe('/mnt/test');
      expect(spectator.component.lastSelectedNode()?.data.path).toBe('/mnt/test');
      expect(spectator.component.lastSelectedNode()?.data.name).toBe('test');
      expect(spectator.component.lastSelectedNode()?.data.type).toBe(ExplorerNodeType.Directory);
      expect(formControl.value).toBe(testPath);
    });
  });
});
