/* eslint-disable max-classes-per-file */
import {
  ChangeDetectionStrategy, Component, forwardRef, signal,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormControl } from '@ngneat/reactive-forms';
import { SpectatorHost } from '@ngneat/spectator';
import { createHostFactory, mockProvider } from '@ngneat/spectator/jest';
import { TnFilePickerComponent } from '@truenas/ui-components';
import { of } from 'rxjs';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { ExplorerNodeData } from 'app/interfaces/tree-node.interface';
import { ExplorerCreateAction } from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-action';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { ErrorParserService } from 'app/services/errors/error-parser.service';

@Component({
  selector: 'ix-fake-create-action',
  template: '',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: ExplorerCreateAction, useExisting: forwardRef(() => FakeCreateActionComponent) },
  ],
})
class FakeCreateActionComponent implements ExplorerCreateAction {
  readonly id = 'fake-create';
  readonly label = 'Create Fake';
  readonly canCreate = signal(true);
  canCreateAt = jest.fn(() => true);
  create = jest.fn(() => of('/mnt/created'));
}

@Component({
  selector: 'ix-fake-inline-create-action',
  template: '',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: ExplorerCreateAction, useExisting: forwardRef(() => FakeInlineCreateActionComponent) },
  ],
})
class FakeInlineCreateActionComponent implements ExplorerCreateAction {
  readonly id = 'fake-inline';
  readonly label = 'Create Inline';
  readonly icon = 'tn-dataset';
  readonly canCreate = signal(true);
  canCreateAt = jest.fn(() => true);
  createInline = jest.fn(() => Promise.resolve('/mnt/tank/created'));
}

describe('IxExplorerComponent', () => {
  const fakeNodeProvider = jest.fn(() => of<ExplorerNodeData[]>([]));

  let spectator: SpectatorHost<IxExplorerComponent>;
  const formControl = new FormControl<string | string[]>();
  const createHost = createHostFactory({
    component: IxExplorerComponent,
    imports: [
      ReactiveFormsModule,
      FakeCreateActionComponent,
      FakeInlineCreateActionComponent,
    ],
    providers: [
      mockProvider(ErrorParserService, {
        getFirstErrorMessage: jest.fn(() => 'Provider error'),
      }),
    ],
  });

  function getPicker(): TnFilePickerComponent {
    return spectator.query(TnFilePickerComponent)!;
  }

  function getInput(): HTMLInputElement {
    return spectator.query('tn-file-picker input')!;
  }

  function typePath(value: string): void {
    const input = getInput();
    input.value = value;
    spectator.dispatchFakeEvent(input, 'change');
    spectator.detectChanges();
  }

  beforeEach(() => {
    fakeNodeProvider.mockClear();
    fakeNodeProvider.mockReturnValue(of<ExplorerNodeData[]>([]));
    formControl.reset();

    spectator = createHost(
      `<ix-explorer
        [formControl]="formControl"
        [nodeProvider]="nodeProvider"
        [label]="label"
        [hint]="hint"
        [required]="required"
        [tooltip]="tooltip"
        [rootNodes]="roots"
        [multiple]="multiple"
      >
        <ix-fake-create-action></ix-fake-create-action>
        <ix-fake-inline-create-action></ix-fake-inline-create-action>
      </ix-explorer>`,
      {
        hostProps: {
          formControl,
          nodeProvider: fakeNodeProvider,
          label: undefined,
          hint: undefined,
          required: false,
          tooltip: undefined,
          roots: [{
            hasChildren: true,
            name: mntPath,
            path: mntPath,
            type: ExplorerNodeType.Directory,
          }],
          multiple: false,
        },
      },
    );
  });

  describe('rendering', () => {
    it('confines the picker to a single absolute root node', () => {
      expect(getPicker().rootPath()).toBe(mntPath);
      expect(getPicker().startPath()).toBe(mntPath);
    });

    it('falls back to / for a dynamic single root, listing it at the top level', async () => {
      spectator.setHostInput('roots', [
        {
          hasChildren: true, name: 'dozer', path: '/mnt/dozer', type: ExplorerNodeType.Directory, isMountpoint: true,
        },
      ]);
      spectator.detectComponentChanges();

      expect(getPicker().rootPath()).toBe('/');

      const items = await getPicker().callbacks()!.getChildren!('/');

      expect(fakeNodeProvider).not.toHaveBeenCalled();
      expect(items).toEqual([
        { path: '/mnt/dozer', name: 'dozer', type: 'dataset' },
      ]);
    });

    it('falls back to / and lists rootNodes at the top level when there are several roots', async () => {
      spectator.setHostInput('roots', [
        {
          hasChildren: true, name: 'pool1', path: '/mnt/pool1', type: ExplorerNodeType.Directory, isMountpoint: true,
        },
        {
          hasChildren: true, name: 'pool2', path: '/mnt/pool2', type: ExplorerNodeType.Directory, isMountpoint: true,
        },
      ]);
      spectator.detectComponentChanges();

      expect(getPicker().rootPath()).toBe('/');

      const items = await getPicker().callbacks()!.getChildren!('/');

      expect(fakeNodeProvider).not.toHaveBeenCalled();
      expect(items).toEqual([
        { path: '/mnt/pool1', name: 'pool1', type: 'dataset' },
        { path: '/mnt/pool2', name: 'pool2', type: 'dataset' },
      ]);
    });

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

  describe('form control – multiple=false', () => {
    it('shows value provided in form control', () => {
      formControl.setValue('/mnt/whatever');
      spectator.detectComponentChanges();

      expect(getInput()).toHaveValue('/mnt/whatever');
    });

    it('updates form control when user types in new value in the input', () => {
      typePath('/mnt/new');

      expect(formControl.value).toBe('/mnt/new');
    });

    it('commits non-path values like SMB external shares verbatim', () => {
      typePath('EXTERNAL:192.168.0.200\\SHARE');

      expect(formControl.value).toBe('EXTERNAL:192.168.0.200\\SHARE');
      expect(getInput()).toHaveValue('EXTERNAL:192.168.0.200\\SHARE');
      expect(spectator.component.loadingError()).toBeNull();
    });

    it('clears form control when input is cleared', () => {
      formControl.setValue('/mnt/whatever');
      spectator.detectComponentChanges();

      typePath('');

      expect(formControl.value).toBe('');
    });
  });

  describe('form control – multiple=true', () => {
    beforeEach(() => {
      spectator.setHostInput('multiple', true);
      spectator.detectComponentChanges();
    });

    it('shows values provided in form control', () => {
      formControl.setValue(['/mnt/place1', '/mnt/place2']);
      spectator.detectComponentChanges();

      expect(getInput()).toHaveValue('/mnt/place1, /mnt/place2');
    });

    it('updates form control value when user writes multiple comma-separated entries in the input', () => {
      typePath('/mnt/new1,/mnt/new2');

      expect(formControl.value).toEqual(['/mnt/new1', '/mnt/new2']);
    });
  });

  describe('open on click', () => {
    it('opens the picker popup when the input is clicked while empty', () => {
      spectator.dispatchFakeEvent(getInput(), 'click');

      expect(getPicker().isOpen()).toBe(true);
      getPicker().close();
    });

    it('does not open the picker popup on click when a path is set', () => {
      formControl.setValue('/mnt/whatever');
      spectator.detectComponentChanges();

      spectator.dispatchFakeEvent(getInput(), 'click');

      expect(getPicker().isOpen()).toBe(false);
    });

    it('closes the popup when a typed path is committed', () => {
      spectator.dispatchFakeEvent(getInput(), 'click');
      expect(getPicker().isOpen()).toBe(true);

      typePath('/mnt/new');

      expect(getPicker().isOpen()).toBe(false);
      expect(formControl.value).toBe('/mnt/new');
    });
  });

  describe('disabling', () => {
    it('disables the picker input when form control is disabled', () => {
      formControl.disable();
      spectator.detectComponentChanges();
      spectator.detectChanges();

      expect(getInput().disabled).toBe(true);
    });
  });

  describe('node provider adapter', () => {
    it('calls the node provider with the requested path and maps nodes to file items', async () => {
      fakeNodeProvider.mockReturnValue(of([
        {
          path: '/mnt/tank', name: 'tank', type: ExplorerNodeType.Directory, hasChildren: true, isMountpoint: true,
        },
        {
          path: '/mnt/dir', name: 'dir', type: ExplorerNodeType.Directory, hasChildren: true,
        },
        {
          path: '/mnt/locked', name: 'locked', type: ExplorerNodeType.Directory, hasChildren: false, isLock: true,
        },
        {
          path: '/mnt/file.txt', name: 'file.txt', type: ExplorerNodeType.File, hasChildren: false,
        },
      ]));

      const items = await getPicker().callbacks()!.getChildren!(mntPath);

      expect(fakeNodeProvider).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ path: mntPath }) }),
      );
      expect(items).toEqual([
        { path: '/mnt/tank', name: 'tank', type: 'dataset' },
        { path: '/mnt/dir', name: 'dir', type: 'folder' },
        {
          path: '/mnt/locked', name: 'locked', type: 'folder', icon: 'mdi-folder-lock',
        },
        { path: '/mnt/file.txt', name: 'file.txt', type: 'file' },
      ]);
    });

    it('maps symlinks under /dev/zvol to zvol items', async () => {
      fakeNodeProvider.mockReturnValue(of([
        {
          path: '/dev/zvol/tank/vol1', name: 'vol1', type: ExplorerNodeType.Symlink, hasChildren: false,
        },
      ]));

      const items = await getPicker().callbacks()!.getChildren!('/dev/zvol/tank');

      expect(items).toEqual([
        { path: '/dev/zvol/tank/vol1', name: 'vol1', type: 'zvol' },
      ]);
    });

    it('shows an error message when the node provider fails', async () => {
      fakeNodeProvider.mockImplementation(() => {
        throw new Error('ENOENT');
      });

      const items = await getPicker().callbacks()!.getChildren!(mntPath);
      spectator.detectChanges();

      expect(items).toEqual([]);
      expect(spectator.query('.loading-error')).toHaveText('Provider error');
    });
  });

  describe('relative paths (dataset providers)', () => {
    beforeEach(() => {
      spectator.setHostInput('roots', [{
        hasChildren: true, name: '', path: '', type: ExplorerNodeType.Directory,
      }]);
      spectator.detectComponentChanges();
    });

    it('confines the picker to / and prefixes provider paths with a slash', async () => {
      fakeNodeProvider.mockReturnValue(of([
        {
          path: 'tank', name: 'tank', type: ExplorerNodeType.Directory, hasChildren: true, isMountpoint: true,
        },
      ]));

      expect(getPicker().rootPath()).toBe('/');

      const items = await getPicker().callbacks()!.getChildren!('/');

      expect(fakeNodeProvider).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ path: '' }) }),
      );
      expect(items).toEqual([
        { path: '/tank', name: 'tank', type: 'dataset' },
      ]);
    });

    it('serves nested children for providers that return their whole tree on every call', async () => {
      fakeNodeProvider.mockReturnValue(of([
        {
          path: 'tank',
          name: 'tank',
          type: ExplorerNodeType.Directory,
          hasChildren: true,
          isMountpoint: true,
          children: [
            {
              path: 'tank/child', name: 'child', type: ExplorerNodeType.Directory, hasChildren: false, isMountpoint: true,
            },
          ],
        },
      ]));

      await getPicker().callbacks()!.getChildren!('/');
      const childItems = await getPicker().callbacks()!.getChildren!('/tank');

      expect(childItems).toEqual([
        { path: '/tank/child', name: 'child', type: 'dataset' },
      ]);
    });

    it('stores typed values verbatim, without picker-space mapping', () => {
      typePath('tank/child');

      expect(formControl.value).toBe('tank/child');
    });

    it('strips the slash prefix from popup selections before they reach the form', () => {
      getPicker().writeValue('/tank/child');
      getPicker().onSubmit();

      expect(formControl.value).toBe('tank/child');
    });

    it('shows dataset-space values verbatim in the picker input', () => {
      formControl.setValue('tank/child');
      spectator.detectComponentChanges();

      expect(getInput()).toHaveValue('tank/child');
    });

    it('converts inline-created mountpoints into picker space', async () => {
      const inlineAction = spectator.query(FakeInlineCreateActionComponent)!;

      const pickerAction = getPicker().createActions().find((action) => action.id === 'fake-inline')!;
      const createdPath = await pickerAction.create!('/tank', 'created');

      expect(inlineAction.createInline).toHaveBeenCalledWith('tank', 'created');
      expect(createdPath).toBe('/tank/created');
    });
  });

  describe('lastSelectedNode', () => {
    it('exposes node metadata for the last selected path', async () => {
      const fileNode = {
        path: '/mnt/file.txt', name: 'file.txt', type: ExplorerNodeType.File, hasChildren: false,
      };
      fakeNodeProvider.mockReturnValue(of([fileNode]));
      await getPicker().callbacks()!.getChildren!(mntPath);

      getPicker().selectionChange.emit('/mnt/file.txt');

      expect(spectator.component.lastSelectedNode()).toBe(fileNode);
    });

    it('resolves node metadata for relative value-space selections', async () => {
      spectator.setHostInput('roots', [{
        hasChildren: true, name: '', path: '', type: ExplorerNodeType.Directory,
      }]);
      spectator.detectComponentChanges();

      const datasetNode = {
        path: 'tank/child', name: 'child', type: ExplorerNodeType.Directory, hasChildren: false, isMountpoint: true,
      };
      fakeNodeProvider.mockReturnValue(of([datasetNode]));
      await getPicker().callbacks()!.getChildren!('/tank');

      getPicker().selectionChange.emit('tank/child');

      expect(spectator.component.lastSelectedNode()).toBe(datasetNode);
    });

    it('clears lastSelectedNode when selection is emptied', async () => {
      const fileNode = {
        path: '/mnt/file.txt', name: 'file.txt', type: ExplorerNodeType.File, hasChildren: false,
      };
      fakeNodeProvider.mockReturnValue(of([fileNode]));
      await getPicker().callbacks()!.getChildren!(mntPath);
      getPicker().selectionChange.emit('/mnt/file.txt');

      getPicker().selectionChange.emit('');

      expect(spectator.component.lastSelectedNode()).toBeNull();
    });
  });

  describe('create actions', () => {
    it('surfaces projected create actions allowed at the browsed directory', () => {
      getPicker().pathChange.emit('/mnt/tank');
      spectator.detectChanges();

      expect(getPicker().createActions()).toEqual([
        { id: 'fake-create', label: 'Create Fake' },
        {
          id: 'fake-inline', label: 'Create Inline', icon: 'tn-dataset', create: expect.any(Function),
        },
      ]);
    });

    it('hides create actions that are not allowed at the browsed directory', () => {
      spectator.query(FakeCreateActionComponent)!.canCreateAt.mockReturnValue(false);
      spectator.query(FakeInlineCreateActionComponent)!.canCreateAt.mockReturnValue(false);

      getPicker().pathChange.emit('/mnt');
      spectator.detectChanges();

      expect(getPicker().createActions()).toEqual([]);
    });

    it('wires inline creation through to the picker with path-space conversion', async () => {
      const inlineAction = spectator.query(FakeInlineCreateActionComponent)!;

      const pickerAction = getPicker().createActions().find((action) => action.id === 'fake-inline')!;
      const createdPath = await pickerAction.create!('/mnt/tank', 'created');

      expect(inlineAction.createInline).toHaveBeenCalledWith('/mnt/tank', 'created');
      expect(createdPath).toBe('/mnt/tank/created');
    });

    it('runs the matching create flow and selects the created path', () => {
      const selectPath = jest.spyOn(getPicker(), 'selectPath').mockResolvedValue();
      const fakeAction = spectator.query(FakeCreateActionComponent)!;

      getPicker().createAction.emit({ actionId: 'fake-create', parentPath: '/mnt/tank' });

      expect(fakeAction.create).toHaveBeenCalledWith('/mnt/tank');
      expect(selectPath).toHaveBeenCalledWith('/mnt/created');
    });

    it('surfaces a failed post-create selection as a loading error', async () => {
      jest.spyOn(getPicker(), 'selectPath').mockRejectedValue(new Error('nope'));

      getPicker().createAction.emit({ actionId: 'fake-create', parentPath: '/mnt/tank' });
      await spectator.fixture.whenStable();

      expect(spectator.component.loadingError()).toBe('Provider error');
    });

    it('appends the created path to the value in multiple mode', () => {
      spectator.setHostInput('multiple', true);
      formControl.setValue(['/mnt/existing']);
      spectator.detectComponentChanges();
      const refresh = jest.spyOn(getPicker(), 'refresh').mockResolvedValue();

      getPicker().createAction.emit({ actionId: 'fake-create', parentPath: '/mnt/tank' });

      expect(formControl.value).toEqual(['/mnt/existing', '/mnt/created']);
      expect(refresh).toHaveBeenCalled();
    });
  });
});
