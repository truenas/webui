import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, contentChildren, effect, inject, input, signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ControlValueAccessor, FormControl, NgControl, ReactiveFormsModule,
} from '@angular/forms';
import { MatHint } from '@angular/material/form-field';
import {
  FilePickerCallbacks,
  FilePickerCreateAction,
  FilePickerCreateActionEvent,
  FilePickerError,
  FileSystemItem,
  TnFilePickerComponent,
  tnIconMarker,
} from '@truenas/ui-components';
import { firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { datasetsRootNode } from 'app/constants/basic-root-nodes.constant';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { zvolPath } from 'app/helpers/storage.helper';
import { ExplorerNodeData, TreeNode } from 'app/interfaces/tree-node.interface';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { ExplorerCreateAction } from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-action';
import { TreeNodeProvider } from 'app/modules/forms/ix-forms/components/ix-explorer/tree-node-provider.interface';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { registeredDirectiveConfig } from 'app/modules/forms/ix-forms/directives/registered-control.directive';
import { TestOverrideDirective } from 'app/modules/test-id/test-override/test-override.directive';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { ErrorParserService } from 'app/services/errors/error-parser.service';

@Component({
  selector: 'ix-explorer',
  templateUrl: './ix-explorer.component.html',
  styleUrls: ['./ix-explorer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxLabelComponent,
    IxErrorsComponent,
    MatHint,
    ReactiveFormsModule,
    TestOverrideDirective,
    TnFilePickerComponent,
  ],
  hostDirectives: [
    { ...registeredDirectiveConfig },
  ],
})
export class IxExplorerComponent implements ControlValueAccessor {
  controlDirective = inject(NgControl);
  private errorParser = inject(ErrorParserService);
  private destroyRef = inject(DestroyRef);
  private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly label = input<TranslatedString>();
  readonly hint = input<TranslatedString>();
  readonly readonly = input<boolean>(false);
  readonly multiple = input(false);
  readonly tooltip = input<TranslatedString>();
  readonly required = input<boolean>(false);
  readonly rootNodes = input<ExplorerNodeData[]>([datasetsRootNode]);
  readonly nodeProvider = input.required<TreeNodeProvider>();

  private readonly filePicker = viewChild.required(TnFilePickerComponent);
  private readonly createActionProviders = contentChildren(ExplorerCreateAction, { descendants: true });

  protected readonly pickerControl = new FormControl<string | string[]>('', { nonNullable: true });

  private readonly formDisabled = signal(false);
  readonly isDisabled = computed(() => this.formDisabled() || this.readonly());
  readonly loadingError = signal<string | null>(null);
  readonly lastSelectedNode = signal<ExplorerNodeData | null>(null);

  private value: string | string[] = '';

  /**
   * Every node served to the picker, indexed by its picker-space path. Used to
   * resolve selected paths back to node metadata (`lastSelectedNode`, `nodeAt`)
   * and to serve children for providers that return a pre-built nested tree.
   */
  private nodesByPath = new Map<string, ExplorerNodeData>();

  /** Directory currently being browsed in the picker popup, in provider space. */
  private readonly browsedPath = signal<string>('');

  onChange: (value: string | string[]) => void = (): void => {};
  onTouch: () => void = (): void => {};

  /**
   * tn-file-picker only understands absolute slash-rooted paths, while some
   * providers (replication datasets, pool.filesystem_choices) work with
   * relative dataset names under an empty root. For those, every path is given
   * a leading slash inside the picker and stripped again before it reaches the
   * provider and the form value.
   */
  private readonly usesRelativePaths = computed(() => {
    const rootPath = this.rootNodes()[0]?.path ?? '/';
    return !rootPath.startsWith('/');
  });

  /**
   * The static single roots (`[datasetsRootNode]` → /mnt, `[zvolsRootNode]` →
   * /dev/zvol) become the picker root directly: browsing starts inside them and
   * the popup cannot navigate above them, matching the legacy tree which never
   * showed anything above its roots. Everything else — multiple roots, relative
   * roots, and dynamic single roots like smb's per-pool nodes (whose count
   * varies per system, so rooting inside one would make the same form behave
   * differently across systems) — falls back to `/`, with the top-level listing
   * synthesized from `rootNodes` (see `loadChildren`). Only popup *browsing* is
   * confined — typed paths are committed verbatim through `commitTypedValue`,
   * as in the legacy explorer.
   */
  protected readonly pickerRootPath = computed(() => {
    const roots = this.rootNodes();
    if (roots.length === 1 && [mntPath, zvolPath].includes(roots[0].path)) {
      return roots[0].path;
    }
    return '/';
  });

  /**
   * In relative mode the picker's value space (form value, `selectionChange`,
   * displayed input text) is dataset names — the picker handles the mapping to
   * its internal slash-rooted browse space itself.
   */
  protected readonly pickerValueRoot = computed(() => (this.usesRelativePaths() ? '/' : undefined));

  protected readonly pickerCallbacks: FilePickerCallbacks = {
    getChildren: (path) => this.loadChildren(path),
  };

  protected readonly pickerCreateActions = computed<FilePickerCreateAction[]>(() => {
    const browsedPath = this.browsedPath();
    return this.createActionProviders()
      .filter((action) => {
        // Optional calls: ng-mocks stubs of projected create-action components
        // keep the ExplorerCreateAction provider alias but leave members undefined.
        return !!action.canCreate?.() && !!action.canCreateAt?.(browsedPath);
      })
      .map((action) => {
        const pickerAction: FilePickerCreateAction = { id: action.id, label: action.label };
        if (action.icon) {
          pickerAction.icon = action.icon;
        }
        const createInline = action.createInline?.bind(action);
        if (createInline) {
          // The picker's built-in inline name row: it refreshes the listing and
          // selects the resolved path itself, so only path-space conversion is
          // needed here. Actions without `createInline` instead emit the
          // `createAction` event, handled in `onCreateAction`.
          pickerAction.create = async (parentPath, name) => {
            const createdPath = await createInline(this.fromPickerPath(parentPath), name);
            return this.toPickerPath(this.toProviderSpace(createdPath));
          };
        }
        return pickerAction;
      });
  });

  constructor() {
    this.controlDirective.valueAccessor = this;

    this.pickerControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((pickerValue) => {
      this.onPickerValueChanged(pickerValue);
    });

    effect(() => {
      if (this.isDisabled()) {
        this.pickerControl.disable({ emitEvent: false });
      } else {
        this.pickerControl.enable({ emitEvent: false });
      }
    });

    // A new provider or root invalidates everything resolved through the old
    // one. The root nodes themselves are (re-)indexed so `nodeAt` can answer
    // for the directory the picker starts in.
    effect(() => {
      this.nodeProvider();
      const roots = this.rootNodes();
      this.nodesByPath.clear();
      this.indexNodes(roots);
      this.lastSelectedNode.set(null);
    });

    // The legacy explorer accepted anything typed into the input — comma-separated
    // lists in multiple mode, dataset names, even non-path strings like
    // "EXTERNAL:192.168.0.200\SHARE" (SMB external shares). tn-file-picker's own
    // commit handler rejects anything outside its root, so manual input is taken
    // over here: the capture-phase listener runs before the picker's own `change`
    // listener on the inner input and stops the event from reaching it. Popup
    // interactions are unaffected — the popup renders in a CDK overlay outside
    // this host, so its events never pass through here.
    const host = this.elementRef.nativeElement;
    host.addEventListener('change', this.onManualInputCapture, { capture: true });
    this.destroyRef.onDestroy(() => {
      host.removeEventListener('change', this.onManualInputCapture, { capture: true });
    });
  }

  private onManualInputCapture = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !target.closest('tn-file-picker')) {
      return;
    }

    event.stopPropagation();
    this.commitTypedValue(target.value);
  };

  private commitTypedValue(inputValue: string): void {
    this.loadingError.set(null);

    // Typed values are stored verbatim, as in the legacy explorer — no
    // picker-space mapping. Only popup selections go through `fromPickerPath`.
    let newValue: string | string[];
    if (this.multiple()) {
      newValue = inputValue
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
    } else {
      newValue = inputValue;
    }

    this.value = newValue;
    const lastPath = Array.isArray(newValue) ? newValue[newValue.length - 1] : newValue;
    this.lastSelectedNode.set(lastPath ? this.nodesByPath.get(this.toPickerPath(lastPath)) ?? null : null);
    this.onChange(newValue);
    this.syncPickerValue();
    // A committed typed path settles the interaction — the popup (possibly
    // auto-opened by openOnClick) has nothing left to pick.
    this.filePicker().close();
    this.onTouch();
  }

  writeValue(value: string | string[]): void {
    this.value = value;
    this.syncPickerValue();
  }

  registerOnChange(onChange: (value: string | string[]) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouch = onTouched;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  /** Node metadata for a provider-space path, if it has been listed in the picker. */
  nodeAt(path: string): ExplorerNodeData | undefined {
    return this.nodesByPath.get(this.toPickerPath(path));
  }

  protected onSelectionChange(selection: string | string[]): void {
    const paths = Array.isArray(selection) ? selection : [selection];
    const lastPath = paths[paths.length - 1];
    // `selectionChange` payloads are in value space (relative dataset names
    // when `valueRoot` is set), while `nodesByPath` is keyed by picker space.
    this.lastSelectedNode.set(lastPath ? this.nodesByPath.get(this.toPickerPath(lastPath)) ?? null : null);
    this.onTouch();
  }

  protected onPathChange(pickerPath: string): void {
    this.browsedPath.set(this.fromPickerPath(pickerPath));
  }

  protected onPickerError(error: FilePickerError): void {
    this.loadingError.set(error.message);
  }

  protected onCreateAction(event: FilePickerCreateActionEvent): void {
    const action = this.createActionProviders().find((provider) => provider.id === event.actionId);
    if (!action?.create) {
      return;
    }

    action.create(this.fromPickerPath(event.parentPath))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((createdPath) => {
        if (createdPath) {
          this.applyCreatedPath(createdPath);
        }
      });
  }

  /**
   * Creation flows report an absolute mountpoint even when the explorer works
   * with relative dataset names — normalize into provider space.
   */
  private toProviderSpace(createdPath: string): string {
    return this.usesRelativePaths() ? createdPath.replace(/^\/mnt\/?/, '') : createdPath;
  }

  private applyCreatedPath(createdPath: string): void {
    const path = this.toProviderSpace(createdPath);
    const surfaceError = (error: unknown): void => {
      this.loadingError.set(this.errorParser.getFirstErrorMessage(error));
    };

    if (this.multiple()) {
      const current = this.normalizeToArray(this.value);
      const newValue = current.includes(path) ? current : [...current, path];
      this.value = newValue;
      this.onChange(newValue);
      this.syncPickerValue();
      this.filePicker().refresh().catch(surfaceError);
    } else {
      // selectPath() refreshes the listing, selects the new item and applies it
      // as the picker value, which propagates to the form through pickerControl.
      this.filePicker().selectPath(this.toPickerPath(path)).catch(surfaceError);
    }
  }

  // The picker's value space matches the form's (see `pickerValueRoot`), so
  // values pass through both directions unmapped.
  private onPickerValueChanged(pickerValue: string | string[]): void {
    let newValue: string | string[];

    if (this.multiple()) {
      newValue = (Array.isArray(pickerValue) ? pickerValue : [pickerValue])
        .filter((entry) => entry.length > 0);
    } else {
      newValue = Array.isArray(pickerValue) ? pickerValue[0] ?? '' : pickerValue ?? '';
    }

    this.value = newValue;
    this.loadingError.set(null);
    this.onChange(newValue);
    this.syncPickerValue();
  }

  private syncPickerValue(): void {
    let pickerValue: string | string[];
    if (this.multiple()) {
      pickerValue = this.normalizeToArray(this.value);
    } else {
      pickerValue = Array.isArray(this.value) ? this.value[0] ?? '' : this.value ?? '';
    }
    this.pickerControl.setValue(pickerValue, { emitEvent: false });
  }

  private normalizeToArray(value: string | string[]): string[] {
    if (Array.isArray(value)) {
      return value.filter((path) => path.length > 0);
    }
    return value ? [value] : [];
  }

  private toPickerPath(path: string): string {
    if (this.usesRelativePaths() && path && !path.startsWith('/')) {
      return `/${path}`;
    }
    return path;
  }

  private fromPickerPath(path: string): string {
    if (this.usesRelativePaths() && path.startsWith('/')) {
      return path.slice(1);
    }
    return path;
  }

  private async loadChildren(pickerPath: string): Promise<FileSystemItem[]> {
    const provider = this.nodeProvider();
    this.loadingError.set(null);

    if (!provider) {
      return [];
    }

    if (pickerPath === '/') {
      // Top level = the rootNodes themselves, as in the legacy tree. Roots with
      // an empty or `/` path mean "list the filesystem root through the
      // provider" instead (providers special-case that path themselves).
      const roots = this.rootNodes().filter((root) => root.path && root.path !== '/');
      if (roots.length) {
        this.indexNodes(roots);
        return roots.map((node) => this.toFileItem(node));
      }
    }

    const requestedPath = this.fromPickerPath(pickerPath);
    const requestedNode = {
      data: {
        path: requestedPath,
        name: requestedPath.split('/').findLast((segment) => segment.length > 0) ?? requestedPath,
        type: ExplorerNodeType.Directory,
        hasChildren: true,
      },
    } as TreeNode<ExplorerNodeData>;

    let nodes: ExplorerNodeData[];
    try {
      nodes = await firstValueFrom(
        provider(requestedNode).pipe(
          catchError((error: unknown) => {
            this.loadingError.set(this.errorParser.getFirstErrorMessage(error));
            return of([] as ExplorerNodeData[]);
          }),
        ),
      );
    } catch (error: unknown) {
      this.loadingError.set(this.errorParser.getFirstErrorMessage(error));
      return [];
    }

    this.indexNodes(nodes);
    return this.resolveChildren(requestedPath, nodes).map((node) => this.toFileItem(node));
  }

  private indexNodes(nodes: ExplorerNodeData[]): void {
    for (const node of nodes) {
      this.nodesByPath.set(this.toPickerPath(node.path), node);
      if (node.children?.length) {
        this.indexNodes(node.children);
      }
    }
  }

  /**
   * Most providers return the children of the requested directory, but some
   * (e.g. `DatasetService.getDatasetNodeProvider`) ignore the requested node
   * and return their whole tree with nested `children` on every call. When
   * nothing in the response is under the requested path, serve the nested
   * children indexed from the response instead.
   */
  private resolveChildren(requestedPath: string, response: ExplorerNodeData[]): ExplorerNodeData[] {
    const isUnderRequested = (path: string): boolean => {
      if (!requestedPath || requestedPath === '/') {
        return path !== requestedPath;
      }
      return path.startsWith(`${requestedPath}/`);
    };

    if (response.some((node) => isUnderRequested(node.path))) {
      return response;
    }

    const cached = this.nodesByPath.get(this.toPickerPath(requestedPath));
    if (cached?.children?.length) {
      return cached.children;
    }
    return response;
  }

  private toFileItem(node: ExplorerNodeData): FileSystemItem {
    let type: FileSystemItem['type'];
    let icon: string | undefined;

    switch (node.type) {
      case ExplorerNodeType.File:
        type = 'file';
        break;
      case ExplorerNodeType.Symlink:
        // Zvol block devices are exposed as symlinks under /dev/zvol.
        if (node.path.startsWith(zvolPath)) {
          type = 'zvol';
        } else {
          type = 'file';
          icon = tnIconMarker('database', 'mdi');
        }
        break;
      default:
        type = node.isMountpoint ? 'dataset' : 'folder';
        if (node.isLock) {
          icon = tnIconMarker('folder-lock', 'mdi');
        }
        break;
    }

    return {
      path: this.toPickerPath(node.path),
      name: node.name,
      type,
      ...(icon ? { icon } : {}),
    };
  }
}
