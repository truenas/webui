import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TreeComponent, TreeModel } from '@circlon/angular-tree-component';
import { FormControl } from '@ngneat/reactive-forms';
import { createHostFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent, MockInstance } from 'ng-mocks';
import { of } from 'rxjs';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { IxErrorsComponent } from 'app/modules/ix-forms/components/ix-errors/ix-errors.component';
import { IxExplorerComponent } from 'app/modules/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxLabelComponent } from 'app/modules/ix-forms/components/ix-label/ix-label.component';

describe('IxExplorerComponent', () => {
  const mockTreeMock = {
    selectedLeafNodeIds: {},
    setState(newState) {
      this.selectedLeafNodeIds = newState.selectedLeafNodeIds;
    },
    getState() {
      return {
        selectedLeafNodeIds: this.selectedLeafNodeIds,
      };
    },
  } as TreeModel;
  jest.spyOn(mockTreeMock, 'setState');
  jest.spyOn(mockTreeMock, 'getState');
  MockInstance(TreeComponent, 'treeModel', mockTreeMock);

  const fakeNodeProvider = jest.fn(() => of([]));

  let spectator: Spectator<IxExplorerComponent>;
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
  });

  beforeEach(() => {
    spectator = createHost('<ix-explorer [formControl]="formControl"></ix-explorer>', {
      hostProps: { formControl },
      props: {
        nodeProvider: fakeNodeProvider,
      },
    });
    (mockTreeMock.setState as unknown as jest.SpiedFunction<TreeModel['setState']>).mockClear();
    (mockTreeMock.getState as unknown as jest.SpiedFunction<TreeModel['getState']>).mockClear();
  });

  describe('rendering – tree', () => {
    it('renders a TreeComponent with a root nodes based on `root` attribute', () => {
      const tree = spectator.query(TreeComponent);
      expect(tree.nodes).toEqual([
        {
          hasChildren: true,
          name: '/mnt',
          path: '/mnt',
          type: ExplorerNodeType.Directory,
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
      tree.options.getChildren({ path: '/mnt' });

      expect(fakeNodeProvider).toHaveBeenCalledWith({ path: '/mnt' });
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
