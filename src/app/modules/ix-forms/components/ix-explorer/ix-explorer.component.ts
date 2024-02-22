import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import {
  IActionMapping, ITreeOptions, KEYS, TREE_ACTIONS, TreeComponent,
} from '@bugsplat/angular-tree-component';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { Dataset, DatasetCreate } from 'app/interfaces/dataset.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { ExplorerNodeData, TreeNode } from 'app/interfaces/tree-node.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { CreateDatasetDialogComponent } from 'app/modules/ix-forms/components/ix-explorer/create-dataset-dialog/create-dataset-dialog.component';
import { TreeNodeProvider } from 'app/modules/ix-forms/components/ix-explorer/tree-node-provider.interface';

@UntilDestroy()
@Component({
  selector: 'ix-explorer',
  templateUrl: './ix-explorer.component.html',
  styleUrls: ['./ix-explorer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxExplorerComponent implements OnInit, OnChanges, ControlValueAccessor {
  @Input() label: string;
  @Input() hint: string;
  @Input() multiple = false;
  @Input() tooltip: string;
  @Input() required: boolean;
  @Input() root = mntPath;
  @Input() nodeProvider: TreeNodeProvider;
  @Input() canCreateDataset = false;
  @Input() createDatasetProps: Omit<DatasetCreate, 'name'> = {};

  @ViewChild('tree', { static: true }) tree: TreeComponent;

  inputValue = '';
  value: string | string[];
  isDisabled = false;
  nodes: ExplorerNodeData[] = [];
  loadingError: string;

  onChange: (value: string | string[]) => void = (): void => {};
  onTouch: () => void = (): void => {};

  readonly ExplorerNodeType = ExplorerNodeType;

  get createDatasetDisabled(): boolean {
    return !this.parentDatasetName(Array.isArray(this.value) ? this.value[0] : this.value).length
      || !this.tree.treeModel.selectedLeafNodes.every((node: TreeNode<ExplorerNodeData>) => node.data.isMountpoint)
      || this.isDisabled;
  }

  private readonly actionMapping: IActionMapping = {
    mouse: {
      dblClick: (tree, node, $event) => {
        TREE_ACTIONS.TOGGLE_EXPANDED(tree, node, $event);
      },
      click: (tree, node, $event) => {
        TREE_ACTIONS.TOGGLE_SELECTED(tree, node, $event);
      },
    },
    keys: {
      [KEYS.ENTER]: (tree, node, $event) => {
        TREE_ACTIONS.TOGGLE_SELECTED(tree, node, $event);
      },
    },
  };

  treeOptions: ITreeOptions = {
    idField: 'path',
    displayField: 'name',
    getChildren: (node: TreeNode<ExplorerNodeData>) => firstValueFrom(this.loadChildren(node)),
    actionMapping: this.actionMapping,
    useTriState: false,
  };

  constructor(
    public controlDirective: NgControl,
    private cdr: ChangeDetectorRef,
    private matDialog: MatDialog,
    private translate: TranslateService,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if ('multiple' in changes) {
      this.treeOptions.useCheckbox = this.multiple;
    }

    if ('nodeProvider' in changes || 'root' in changes) {
      this.setInitialNode();
      this.cdr.markForCheck();
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
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }

  onNodeSelect(event: { node: TreeNode<ExplorerNodeData> }): void {
    if (this.multiple) {
      this.selectTreeNodes([
        ...Object.keys(this.tree.treeModel.selectedLeafNodeIds),
        event.node.id as string,
      ]);
    } else {
      this.selectTreeNodes([event.node.id as string]);
    }

    this.onSelectionChanged();
  }

  onNodeDeselect(event: { node: TreeNode<ExplorerNodeData> }): void {
    if (this.multiple) {
      this.selectTreeNodes(
        Object.keys(this.tree.treeModel.selectedLeafNodeIds).filter((node) => node !== event.node.id),
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
    let newValue: string[] | string = Object.entries(this.tree.treeModel.selectedLeafNodeIds)
      .filter(([, isSelected]) => isSelected)
      .map(([nodeId]) => nodeId);

    if (!this.multiple) {
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
    this.value = this.multiple ? inputValue.split(',') : inputValue;
    this.selectTreeNodes(Array.isArray(this.value) ? this.value : [this.value]);
    this.onChange(this.value);
  }

  isPathSelected(path: string): boolean {
    return typeof this.value === 'string' ? this.value === path : this.value?.some((content: string) => content === path);
  }

  parentDatasetName(path: string): string {
    return (!path || path === this.root) ? '' : path.replace(`${this.root}/`, '');
  }

  createDataset(): void {
    this.matDialog.open(CreateDatasetDialogComponent, {
      data: {
        parentId: this.parentDatasetName(Array.isArray(this.value) ? this.value[0] : this.value),
        dataset: this.createDatasetProps,
      },
    }).afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((dataset: Dataset) => {
        if (!dataset) {
          return;
        }

        const parentNode = this.tree.treeModel.selectedLeafNodes[0] as TreeNode<ExplorerNodeData>;
        parentNode?.expand();

        this.setInitialNode();
        this.writeValue(`${this.root}/${dataset.name}`);
        this.onChange(this.value);
        this.tree.treeModel.update();
      });
  }

  /**
   * Provides typing in templates
   */
  typeNode(node: TreeNode<ExplorerNodeData>): TreeNode<ExplorerNodeData> {
    return node;
  }

  private setInitialNode(): void {
    this.nodes = [
      {
        path: this.root,
        name: this.root,
        hasChildren: true,
        type: ExplorerNodeType.Directory,
        isMountpoint: true,
      },
    ];
  }

  private updateInputValue(): void {
    this.inputValue = Array.isArray(this.value) ? this.value.filter((value) => value.length).join(',') : this.value || '';
  }

  private selectTreeNodes(nodeIds: string[]): void {
    const treeState = {
      ...this.tree.treeModel.getState(),
      selectedLeafNodeIds: nodeIds.reduce((acc, nodeId) => ({ ...acc, [nodeId]: true }), {}),
    };

    this.tree.treeModel.setState(treeState);
  }

  private loadChildren(node: TreeNode<ExplorerNodeData>): Observable<ExplorerNodeData[]> {
    this.loadingError = null;
    this.cdr.markForCheck();

    if (!this.nodeProvider) {
      return of([]);
    }

    return this.nodeProvider(node).pipe(
      catchError((error: WebsocketError | Error) => {
        this.loadingError = 'reason' in error ? error.reason : error.message;
        this.cdr.markForCheck();
        return of([]);
      }),
    );
  }
}
