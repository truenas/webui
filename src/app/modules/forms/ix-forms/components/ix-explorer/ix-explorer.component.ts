import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component, computed, effect, input, signal, Signal, viewChild,
} from '@angular/core';
import { ControlValueAccessor, NgControl, ReactiveFormsModule } from '@angular/forms';
import { MatError, MatHint } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import {
  IActionMapping, ITreeOptions, KEYS, TREE_ACTIONS, TreeComponent, TreeModel, TreeModule,
} from '@bugsplat/angular-tree-component';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  firstValueFrom, Observable, of,
} from 'rxjs';
import { catchError } from 'rxjs/operators';
import { datasetsRootNode } from 'app/constants/basic-root-nodes.constant';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { zvolPath } from 'app/helpers/storage.helper';
import { ExplorerNodeData, TreeNode } from 'app/interfaces/tree-node.interface';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { TreeNodeProvider } from 'app/modules/forms/ix-forms/components/ix-explorer/tree-node-provider.interface';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { registeredDirectiveConfig } from 'app/modules/forms/ix-forms/directives/registered-control.directive';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestOverrideDirective } from 'app/modules/test-id/test-override/test-override.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { ErrorParserService } from 'app/services/errors/error-parser.service';

@UntilDestroy()
@Component({
  selector: 'ix-explorer',
  templateUrl: './ix-explorer.component.html',
  styleUrls: ['./ix-explorer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxLabelComponent,
    MatInput,
    TreeModule,
    MatError,
    IxErrorsComponent,
    MatHint,
    TranslateModule,
    TestDirective,
    ReactiveFormsModule,
    TestOverrideDirective,
    IxIconComponent,
  ],
  hostDirectives: [
    { ...registeredDirectiveConfig },
  ],
})
export class IxExplorerComponent implements ControlValueAccessor {
  readonly label = input<TranslatedString>();
  readonly hint = input<TranslatedString>();
  readonly readonly = input<boolean>(false);
  readonly multiple = input(false);
  readonly tooltip = input<TranslatedString>();
  readonly required = input<boolean>(false);
  readonly rootNodes = input<ExplorerNodeData[]>([datasetsRootNode]);
  readonly nodeProvider = input.required<TreeNodeProvider>();

  // TODO: Should be private, but it's used directly in tests
  readonly tree = viewChild.required(TreeComponent);

  protected inputValue = '';
  protected value: string | string[];
  readonly isDisabled = signal(false);
  readonly nodes = signal<ExplorerNodeData[]>([]);
  readonly loadingError = signal<string | null>(null);

  onChange: (value: string | string[]) => void = (): void => {};
  onTouch: () => void = (): void => {};

  readonly ExplorerNodeType = ExplorerNodeType;

  readonly lastSelectedNode = signal<TreeNode<ExplorerNodeData> | null>(null);

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
    private translate: TranslateService,
    private errorParser: ErrorParserService,
  ) {
    this.controlDirective.valueAccessor = this;
    effect(() => {
      const nodeProvider = this.nodeProvider();
      if (nodeProvider) {
        this.setInitialNodes();
      }
    });
    effect(() => {
      const rootNodes = this.rootNodes();
      if (rootNodes) {
        this.setInitialNodes();
      }
    });
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
    this.isDisabled.set(isDisabled || this.readonly());
    this.cdr.markForCheck();
  }

  onNodeSelect(event: { node: TreeNode<ExplorerNodeData> }): void {
    if (!event.node.id) {
      return;
    }

    this.lastSelectedNode.set(event.node);

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

    if (event.node.id === this.lastSelectedNode()?.id) {
      this.lastSelectedNode.set(null);
    }

    this.onSelectionChanged();
  }

  ariaLabel(node: TreeNode<ExplorerNodeData>): string {
    return this.translate.instant(
      'Highlighted path is {node}. Press \'Space\' to {expand}. Press \'Enter\' to {select}.',
      {
        expand: node?.isExpanded
          ? this.translate.instant('Collapse')
          : this.translate.instant('Expand'),
        select: node?.isSelected
          ? this.translate.instant('Deselect')
          : this.translate.instant('Select'),
        node: node.data.path.replace(/.{1}/g, '$&,').replace(/\//g, 'slash'),
      },
    );
  }

  private onSelectionChanged(): void {
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
    this.cdr.markForCheck();
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

  refreshNode(node: TreeNode<ExplorerNodeData>): void {
    node.data.children = null;
    node.treeModel.update();
    node.expand();
  }

  /**
   * Provides typing in templates
   */
  typeNode(node: TreeNode<ExplorerNodeData>): TreeNode<ExplorerNodeData> {
    return node;
  }

  private setInitialNodes(): void {
    const roots = this.rootNodes();
    this.nodes.set([...roots]);
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
        this.loadingError.set(this.errorParser.getFirstErrorMessage(error));
        return of([]);
      }),
    );
  }
}
