import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component, computed, input,
  OnChanges,
  OnInit, signal, Signal, viewChild,
} from '@angular/core';
import { ControlValueAccessor, NgControl, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatError, MatHint } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import {
  IActionMapping, ITreeOptions, KEYS, TREE_ACTIONS, TreeComponent, TreeModel, TreeModule,
} from '@bugsplat/angular-tree-component';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  firstValueFrom, Observable, of,
} from 'rxjs';
import { catchError, filter } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { Role } from 'app/enums/role.enum';
import { zvolPath } from 'app/helpers/storage.helper';
import { Dataset, DatasetCreate } from 'app/interfaces/dataset.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { ExplorerNodeData, TreeNode } from 'app/interfaces/tree-node.interface';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { CreateDatasetDialogComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/create-dataset-dialog/create-dataset-dialog.component';
import { TreeNodeProvider } from 'app/modules/forms/ix-forms/components/ix-explorer/tree-node-provider.interface';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { registeredDirectiveConfig } from 'app/modules/forms/ix-forms/directives/registered-control.directive';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestOverrideDirective } from 'app/modules/test-id/test-override/test-override.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-explorer',
  templateUrl: './ix-explorer.component.html',
  styleUrls: ['./ix-explorer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxLabelComponent,
    MatInput,
    MatButton,
    IxIconComponent,
    TreeModule,
    MatError,
    IxErrorsComponent,
    MatHint,
    TranslateModule,
    RequiresRolesDirective,
    TestDirective,
    ReactiveFormsModule,
    TestOverrideDirective,
  ],
  hostDirectives: [
    { ...registeredDirectiveConfig },
  ],
})
export class IxExplorerComponent implements OnInit, OnChanges, ControlValueAccessor {
  readonly label = input<string>();
  readonly hint = input<string>();
  readonly readonly = input<boolean>(false);
  readonly multiple = input(false);
  readonly tooltip = input<string>();
  readonly required = input<boolean>(false);
  readonly root = input(mntPath);
  readonly nodeProvider = input.required<TreeNodeProvider>();
  // TODO: Come up with a system of extendable controls.
  // TODO: Add support for zvols.
  readonly canCreateDataset = input(false);
  readonly createDatasetProps = input<Omit<DatasetCreate, 'name'>>({});

  // TODO: Should be private, but it's used directly in tests
  readonly tree = viewChild.required(TreeComponent);

  protected readonly requiredRoles = [Role.DatasetWrite];

  inputValue = '';
  value: string | string[];
  isDisabled = false;
  readonly nodes = signal<ExplorerNodeData[]>([]);
  readonly loadingError = signal<string | null>(null);

  onChange: (value: string | string[]) => void = (): void => {};
  onTouch: () => void = (): void => {};

  readonly ExplorerNodeType = ExplorerNodeType;

  get createDatasetDisabled(): boolean {
    return !this.parentDatasetName(Array.isArray(this.value) ? this.value[0] : this.value).length
      || !this.tree().treeModel.selectedLeafNodes.every((node: TreeNode<ExplorerNodeData>) => node.data.isMountpoint)
      || this.isDisabled;
  }

  private toggleExpandNodeFn = (
    tree: TreeModel,
    node: TreeNode<ExplorerNodeData>,
    $event: MouseEvent,
  ): void => {
    const path = node.path.reduce((prev, curr) => `${prev}/${curr}`);
    if (node.isCollapsed && node.hasChildren && node.children && path.includes(zvolPath)) {
      node.children = null;
    }
    TREE_ACTIONS.TOGGLE_EXPANDED(tree, node, $event);
  };

  private readonly actionMapping: IActionMapping = {
    mouse: {
      expanderClick: this.toggleExpandNodeFn.bind(this),
      dblClick: this.toggleExpandNodeFn.bind(this),
      click: TREE_ACTIONS.TOGGLE_SELECTED,
    },
    keys: {
      [KEYS.ENTER]: TREE_ACTIONS.TOGGLE_SELECTED,
      [KEYS.SPACE]: this.toggleExpandNodeFn.bind(this),
    },
  };

  treeOptions: Signal<ITreeOptions> = computed<ITreeOptions>(() => {
    return {
      idField: 'path',
      displayField: 'name',
      getChildren: (node: TreeNode<ExplorerNodeData>) => firstValueFrom(this.loadChildren(node)),
      actionMapping: this.actionMapping,
      useTriState: false,
      useCheckbox: this.multiple(),
    };
  });

  constructor(
    public controlDirective: NgControl,
    private cdr: ChangeDetectorRef,
    private matDialog: MatDialog,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if ('nodeProvider' in changes || 'root' in changes) {
      this.setInitialNode();
    }
  }

  ngOnInit(): void {
    this.setInitialNode();
  }

  writeValue(value: string | string[]): void {
    this.value = value;
    this.updateInputValue();
    this.selectTreeNodes(Array.isArray(value) ? value : [value]);
    this.cdr.markForCheck();
  }

  registerOnChange(onChange: (value: string | string[]) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouch = onTouched;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled || this.readonly();
    this.cdr.markForCheck();
  }

  onNodeSelect(event: { node: TreeNode<ExplorerNodeData> }): void {
    if (!event.node.id) {
      return;
    }

    if (this.multiple()) {
      this.selectTreeNodes([
        ...Object.keys(this.tree().treeModel.selectedLeafNodeIds),
        event.node.id as string,
      ]);
    } else {
      this.selectTreeNodes([event.node.id as string]);
    }

    this.onSelectionChanged();
  }

  onNodeDeselect(event: { node: TreeNode<ExplorerNodeData> }): void {
    if (this.multiple()) {
      this.selectTreeNodes(
        Object.keys(this.tree().treeModel.selectedLeafNodeIds).filter((node) => node !== event.node.id),
      );
    } else {
      this.selectTreeNodes([]);
    }

    this.onSelectionChanged();
  }

  ariaLabel(node: TreeNode<ExplorerNodeData>): string {
    return this.translate.instant(
      'Highlighted path is {node}. Press \'Space\' to {expand}. Press \'Enter\' to {select}.',
      {
        expand: node?.isExpanded ? 'Collapse' : 'Expand',
        select: node?.isSelected ? 'Unselect' : 'Select',
        node: node.data.path.replace(/.{1}/g, '$&,').replace(/\//g, 'slash'),
      },
    );
  }

  onSelectionChanged(): void {
    let newValue: string[] | string = Object.entries(this.tree().treeModel.selectedLeafNodeIds)
      .filter(([, isSelected]) => isSelected)
      .map(([nodeId]) => nodeId);

    if (!this.multiple()) {
      newValue = newValue[0];
    }

    if (newValue === this.value) {
      return;
    }

    this.value = newValue;
    this.updateInputValue();
    this.onChange(newValue);
  }

  onInputChanged(inputValue: string): void {
    this.inputValue = inputValue;
    this.value = this.multiple() ? inputValue.split(',') : inputValue;
    this.selectTreeNodes(Array.isArray(this.value) ? this.value : [this.value]);
    this.onChange(this.value);
  }

  isPathSelected(path: string): boolean {
    return typeof this.value === 'string' ? this.value === path : this.value?.some((content: string) => content === path);
  }

  parentDatasetName(path: string): string {
    if (!path || path === this.root()) {
      return '';
    }

    return path
      .replace(`${this.root()}/`, '')
      .replace('/mnt/', '');
  }

  createDataset(): void {
    this.matDialog.open(CreateDatasetDialogComponent, {
      data: {
        parentId: this.parentDatasetName(Array.isArray(this.value) ? this.value[0] : this.value),
        dataset: this.createDatasetProps(),
      },
    }).afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe((dataset: Dataset) => {
        const parentNode = this.tree().treeModel.selectedLeafNodes[0] as TreeNode<ExplorerNodeData>;
        if (parentNode?.isExpanded) {
          parentNode.collapse();
        }

        // This code is necessary to make sure that newly created dataset appears
        // in the tree if tree has already been expanded.
        parentNode.data.children = null;
        parentNode.treeModel.update();
        parentNode.expand();

        this.writeValue(dataset.mountpoint);
        this.onChange(this.value);
      });
  }

  /**
   * Provides typing in templates
   */
  typeNode(node: TreeNode<ExplorerNodeData>): TreeNode<ExplorerNodeData> {
    return node;
  }

  private setInitialNode(): void {
    this.nodes.set([
      {
        path: this.root(),
        name: this.root(),
        hasChildren: true,
        type: ExplorerNodeType.Directory,
        isMountpoint: true,
      },
    ]);
  }

  private updateInputValue(): void {
    this.inputValue = Array.isArray(this.value) ? this.value.filter((value) => value.length).join(',') : this.value || '';
  }

  private selectTreeNodes(nodeIds: string[]): void {
    const treeState = {
      ...this.tree().treeModel.getState(),
      selectedLeafNodeIds: nodeIds.reduce((acc, nodeId) => ({ ...acc, [nodeId]: true }), {}),
    };

    this.tree().treeModel.setState(treeState);
  }

  private loadChildren(node: TreeNode<ExplorerNodeData>): Observable<ExplorerNodeData[]> {
    const provider = this.nodeProvider();
    this.loadingError.set(null);

    if (!provider) {
      return of([]);
    }

    return provider(node).pipe(
      catchError((error: unknown) => {
        this.loadingError.set(this.errorHandler.getFirstErrorMessage(error));
        return of([]);
      }),
    );
  }
}
