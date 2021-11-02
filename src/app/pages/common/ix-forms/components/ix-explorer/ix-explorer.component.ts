import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, ViewChild,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import {
  IActionMapping,
  ITreeOptions,
  KEYS,
  TREE_ACTIONS,
  TreeComponent,
  TreeModel,
} from 'angular-tree-component';
import { Observable } from 'rxjs';
import { TreeNode, ExplorerNodeData } from 'app/interfaces/tree-node.interface';

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
        TREE_ACTIONS.FOCUS(tree, node, $event);
      },
    },
  };

  readonly treeOptions: ITreeOptions = {
    idField: 'path',
    displayField: 'name',
    // TODO: Handle loading errors
    getChildren: (node) => this.nodeProvider(node).toPromise(),
    actionMapping: this.actionMapping,
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

  onSelectionUpdated(event: { treeModel: TreeModel }): void {
    const newValue = Object.keys(event.treeModel.selectedLeafNodeIds)[0];

    if (newValue === this.value) {
      return;
    }

    this.value = newValue;
    this.onChange(newValue);
  }

  // TODO: Use directive from: https://stackoverflow.com/questions/55458421/ng-template-typed-variable ?
  typeNode(node: TreeNode<ExplorerNodeData>): TreeNode<ExplorerNodeData> {
    return node;
  }
}
