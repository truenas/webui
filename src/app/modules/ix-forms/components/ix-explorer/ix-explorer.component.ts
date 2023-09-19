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
import {
  IActionMapping, ITreeOptions, KEYS, TREE_ACTIONS, TreeComponent,
} from '@bugsplat/angular-tree-component';
import { UntilDestroy } from '@ngneat/until-destroy';
import { lastValueFrom, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { ExplorerNodeData, TreeNode } from 'app/interfaces/tree-node.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
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

  @ViewChild('tree', { static: true }) tree: TreeComponent;

  inputValue = '';
  value: string | string[];
  isDisabled = false;
  nodes: ExplorerNodeData[] = [];
  loadingError: string;

  onChange: (value: string | string[]) => void = (): void => {};
  onTouch: () => void = (): void => {};

  readonly ExplorerNodeType = ExplorerNodeType;

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
    getChildren: (node) => lastValueFrom(this.loadChildren(node)),
    actionMapping: this.actionMapping,
    useTriState: false,
  };

  constructor(
    public controlDirective: NgControl,
    private cdr: ChangeDetectorRef,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if ('multiple' in changes) {
      this.treeOptions.useCheckbox = this.multiple;
    }

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
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }

  onNodeSelect(event: { node: TreeNode<ExplorerNodeData> }): void {
    if (this.multiple) {
      this.selectTreeNodes([
        ...Object.keys(this.tree.treeModel.selectedLeafNodeIds),
        event.node.id,
      ]);
    } else {
      this.selectTreeNodes([event.node.id]);
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
    this.value = this.multiple ? inputValue.split(',') : inputValue;
    this.selectTreeNodes(Array.isArray(this.value) ? this.value : [this.value]);
    this.onChange(this.value);
  }

  isPathSelected(path: string): boolean {
    return typeof this.value === 'string' ? this.value === path : this.value?.some((content: string) => content === path);
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
      },
    ];
  }

  private updateInputValue(): void {
    this.inputValue = Array.isArray(this.value) ? this.value.join(',') : this.value || '';
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
