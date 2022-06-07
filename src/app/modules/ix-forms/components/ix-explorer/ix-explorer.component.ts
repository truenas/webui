import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, ViewChild,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import {
  IActionMapping,
  ITreeOptions,
  KEYS,
  TREE_ACTIONS,
  TreeComponent,
} from '@circlon/angular-tree-component';
import { UntilDestroy } from '@ngneat/until-destroy';
import { findKey } from 'lodash';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { TreeNode, ExplorerNodeData } from 'app/interfaces/tree-node.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';

export type TreeNodeProvider = (parent: TreeNode<ExplorerNodeData>) => Observable<ExplorerNodeData[]>;

@UntilDestroy()
@Component({
  selector: 'ix-explorer',
  templateUrl: './ix-explorer.component.html',
  styleUrls: ['./ix-explorer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxExplorerComponent implements OnInit, ControlValueAccessor {
  @Input() label: string;
  @Input() hint: string;
  @Input() tooltip: string;
  @Input() required: boolean;
  @Input() root = '/mnt';
  @Input() nodeProvider: TreeNodeProvider;

  @ViewChild('tree') tree: TreeComponent;

  value = '';
  isDisabled = false;
  nodes: ExplorerNodeData[] = [];
  loadingError: string;

  onChange: (value: string) => void = (): void => {};
  onTouch: () => void = (): void => {};

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

  readonly treeOptions: ITreeOptions = {
    idField: 'path',
    displayField: 'name',
    getChildren: (node) => this.nodeProvider(node).pipe(
      tap(() => {
        this.loadingError = null;
      }),
      catchError((error: WebsocketError | Error) => {
        this.loadingError = 'reason' in error ? error.reason : error.message;
        this.cdr.markForCheck();
        return of([]);
      }),
    ).toPromise(),
    actionMapping: this.actionMapping,
    useTriState: false,
  };

  constructor(
    public controlDirective: NgControl,
    private cdr: ChangeDetectorRef,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  ngOnInit(): void {
    this.nodes = [
      {
        path: this.root,
        name: this.root,
        hasChildren: true,
      },
    ];
  }

  writeValue(value: string): void {
    this.value = value;
    this.cdr.markForCheck();
  }

  registerOnChange(onChange: (value: string) => void): void {
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
    // TODO: If you ever need to implement multiple selection adjust code here
    // Ensure only one node is selected
    const treeState = {
      ...this.tree.treeModel.getState(),
      selectedLeafNodeIds: {
        [event.node.id]: true,
      },
    };

    this.tree.treeModel.setState(treeState);

    this.onSelectionChanged();
  }

  onSelectionChanged(): void {
    const newValue = findKey(this.tree.treeModel.selectedLeafNodeIds, (isSelected) => isSelected);

    if (newValue === this.value) {
      return;
    }

    this.value = newValue;
    this.onChange(newValue);
  }

  valueChangedCustom(value: string): void {
    this.value = value;
    this.onChange(value);
  }

  /**
   * Provides typing in templates
   */
  typeNode(node: TreeNode<ExplorerNodeData>): TreeNode<ExplorerNodeData> {
    return node;
  }
}
