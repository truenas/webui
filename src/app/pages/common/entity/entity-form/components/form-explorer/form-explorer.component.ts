import {Component, ViewContainerRef, OnInit} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {EntityFormService} from '../../services/entity-form.service';
import { TreeNode, TREE_ACTIONS, KEYS, IActionMapping } from 'angular-tree-component';


import {FieldConfig} from '../../models/field-config.interface';
import {Field} from '../../models/field.interface';
import {TooltipComponent} from '../tooltip/tooltip.component';

const actionMapping:IActionMapping = {
  mouse: {
    contextMenu: (tree, node, $event) => {
      $event.preventDefault();
      alert(`context menu for ${node.data.name}`);
    },
    dblClick: (tree, node, $event) => {
      if (node.hasChildren) TREE_ACTIONS.TOGGLE_EXPANDED(tree, node, $event);
    },
    click: (tree, node, $event) => {
      $event.shiftKey
        ? TREE_ACTIONS.TOGGLE_SELECTED_MULTI(tree, node, $event)
        : TREE_ACTIONS.TOGGLE_SELECTED(tree, node, $event)
    }
  },
  keys: {
    [KEYS.ENTER]: (tree, node, $event) => alert(`This is ${node.data.name}`)
  }
}

@Component({
  selector : 'form-explorer',
  templateUrl : './form-explorer.component.html',
  styleUrls : [ '../dynamic-field/dynamic-field.css' ],
})
export class FormExplorerComponent implements Field, OnInit {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;
  nodes: any[];

  private treeVisible: boolean = false;

constructor (private entityFormService : EntityFormService){}

  ngOnInit() {
    this.nodes = [{
        name: '/mnt',
        hasChildren: true
      }];
  }
  asyncChildren = [
    {
      name: 'child2.1',
      subTitle: 'new and improved'
    }, {
      name: 'child2.2',
      subTitle: 'new and improved2'
    }
  ];

  getChildren(node:any) {
    return new Promise((resolve, reject) => {
      resolve(this.asyncChildren.map((c) => {
        return Object.assign({}, c, {
          hasChildren: node.level < 5
        });
      }));
    });
  }

  customTemplateStringOptions = {
    // displayField: 'subTitle',
    isExpandedField: 'expanded',
    idField: 'uuid',
    getChildren: this.getChildren.bind(this),
    actionMapping,
    nodeHeight: 23,
    allowDrag: true,
    useVirtualScroll: false
  }
  
  private toggleTree() {
    this.treeVisible = !this.treeVisible;
  }
}


