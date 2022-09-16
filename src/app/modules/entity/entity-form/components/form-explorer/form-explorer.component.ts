import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import {
  TREE_ACTIONS, KEYS, IActionMapping, TreeNode, ITreeOptions, TreeModel,
} from '@circlon/angular-tree-component';
import { TranslateService } from '@ngx-translate/core';
import { ExplorerType } from 'app/enums/explorer-type.enum';
import { ListdirChild } from 'app/interfaces/listdir-child.interface';
import { FormExplorerConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { Field } from 'app/modules/entity/entity-form/models/field.interface';
import { EntityFormService } from 'app/modules/entity/entity-form/services/entity-form.service';

interface TreeNodeEvent {
  isExpanded?: boolean;
  node?: TreeNode;
  treeModel: TreeModel;
  eventName: string;
}

@Component({
  templateUrl: './form-explorer.component.html',
  styleUrls: [
    '../dynamic-field/dynamic-field.scss',
    './form-explorer.component.scss',
  ],
})
export class FormExplorerComponent implements Field, OnInit {
  config: FormExplorerConfig;
  group: UntypedFormGroup;
  fieldShow: string;
  nodes: (Partial<ListdirChild> & { mountpoint?: string })[];

  private rootSelectable: boolean;

  private actionMapping: IActionMapping = {
    mouse: {
      contextMenu: (tree, node, $event) => {
        $event.preventDefault();
      },
      dblClick: (tree, node, $event) => {
        TREE_ACTIONS.TOGGLE_EXPANDED(tree, node, $event);
      },
      click: (tree, node, $event) => {
        if (node.isRoot && !this.rootSelectable) {
          this.config.warnings = this.translate.instant('Root node is not a valid value');
          return;
        }
        this.config.warnings = null;
        if (this.config.multiple) {
          TREE_ACTIONS.TOGGLE_SELECTED(tree, node, $event);
        } else {
          this.setPath(node);
        }
        TREE_ACTIONS.FOCUS(tree, node, $event);
      },
    },
    keys: {
      [KEYS.ENTER]: (tree, node, $event) => {
        this.setPath(node);
        TREE_ACTIONS.FOCUS(tree, node, $event);
      },
    },
  };

  customTemplateStringOptions: ITreeOptions = {
    useCheckbox: false,
    displayField: '',
    isExpandedField: 'expanded',
    idField: 'uuid',
    getChildren: this.getChildren.bind(this),
    actionMapping: this.actionMapping,
    nodeHeight: 23,
    allowDrag: true,
    useVirtualScroll: false,
    useTriState: true,
  };

  readonly ExplorerType = ExplorerType;

  constructor(private entityFormService: EntityFormService,
    public translate: TranslateService) {}

  ngOnInit(): void {
    this.rootSelectable = this.config.rootSelectable === undefined ? true : this.config.rootSelectable;

    if (this.config.multiple) {
      this.customTemplateStringOptions.useCheckbox = this.config.multiple;
      this.customTemplateStringOptions.useTriState = this.config.tristate;
    }

    if (this.config.customTemplateStringOptions) {
      if (!this.config.customTemplateStringOptions.actionMapping) {
        this.config.customTemplateStringOptions.actionMapping = this.actionMapping;
      }
      this.config.customTemplateStringOptions.explorerComponent = this;
      this.customTemplateStringOptions = this.config.customTemplateStringOptions;
      this.config.customTemplateStringOptions.explorer = this;
    }

    this.nodes = [{
      name: this.config.initial,
      subTitle: this.config.initial,
      hasChildren: true,
      expanded: !this.rootSelectable,
    }];

    this.customTemplateStringOptions.displayField = 'subTitle';
  }

  getChildren(node: TreeNode): Promise<ListdirChild[]> {
    switch (this.config.explorerType) {
      case ExplorerType.Directory:
        return this.entityFormService.getFilesystemListdirChildren(node, ExplorerType.Directory);
      case ExplorerType.Dataset:
        return this.entityFormService.getPoolDatasets(this.config.explorerParam ? this.config.explorerParam : []);
      default:
        return this.entityFormService.getFilesystemListdirChildren(node);
    }
  }

  shouldBeDisabled(): boolean {
    return this.config.disabled || this.config.readonly;
  }

  setPath(node: TreeNode): void {
    this.group.controls[this.config.name].setValue(node.data.name);
  }

  onClick(event: TreeNodeEvent): void {
    const selectedTreeNodes = Object
      .entries(event.treeModel.selectedLeafNodeIds)
      .filter(([, value]) => value)
      .map((node) => event.treeModel.getNodeById(node[0]));
    // this is to mark selected node, but not update form value
    if (event.eventName === 'select' && this.group.controls[this.config.name].value && this.group.controls[this.config.name].value.indexOf(event.node.data.name) > -1) {
      return;
    }
    this.valueHandler(selectedTreeNodes);
  }

  valueHandler(selectedTreeNodes: TreeNode[]): void {
    const res: string[] = [];
    selectedTreeNodes.forEach((node) => {
      if (node === undefined) {
        return;
      }
      if (node.parent.isAllSelected && this.config.tristate) {
        let parent = node;
        while (
          parent && !parent.isRoot
          && parent.parent && !parent.parent.isRoot && parent.parent.isAllSelected
        ) {
          parent = parent.parent;
        }
        if (!res.includes(parent.data.name)) {
          res.push(parent.data.name);
        }
      } else if (node.isAllSelected) {
        if (node.data.name !== '') {
          res.push(node.data.name);
        }
      }
    });
    this.group.controls[this.config.name].setValue(res);
  }

  loadNodeChildren(event: TreeNodeEvent): void {
    if (this.customTemplateStringOptions.useCheckbox && this.group.controls[this.config.name].value) {
      for (const item of (event.node.data.children || [])) {
        if (this.group.controls[this.config.name].value.indexOf(item.name) > -1) {
          const target = event.treeModel.getNodeById(item.uuid);
          target.setIsSelected(true);
        }
      }
    }
  }

  onToggle(event: TreeNodeEvent): void {
    if (
      event.isExpanded
      && this.customTemplateStringOptions.useCheckbox
      && this.group.controls[this.config.name].value
    ) {
      for (const item of (event.node.data.children || [])) {
        if (this.group.controls[this.config.name].value.indexOf(item.name) > -1) {
          const target = event.treeModel.getNodeById(item.uuid);
          target.setIsSelected(true);
        }
      }
    }
  }
}
