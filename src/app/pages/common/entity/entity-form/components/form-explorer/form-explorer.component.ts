import {Component, ViewContainerRef, OnInit} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {EntityFormService} from '../../services/entity-form.service';
import {TREE_ACTIONS, KEYS, IActionMapping } from 'angular-tree-component';
import { TranslateService } from '@ngx-translate/core';

import {FieldConfig} from '../../models/field-config.interface';
import {Field} from '../../models/field.interface';

@Component({
  selector : 'form-explorer',
  templateUrl : './form-explorer.component.html',
  styleUrls : [ 
                '../dynamic-field/dynamic-field.css',
                './form-explorer.component.scss'
              ],
})
export class FormExplorerComponent implements Field, OnInit {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;
  nodes: any[];

  private treeVisible: boolean = false;
  private displayFieldName: string;

  private actionMapping:IActionMapping = {
    mouse: {
      contextMenu: (tree, node, $event) => {
        $event.preventDefault();
      },
      dblClick: (tree, node, $event) => {
        TREE_ACTIONS.TOGGLE_EXPANDED(tree, node, $event);
      },
      click: (tree, node, $event) => {
        if (this.config.multiple) {
          TREE_ACTIONS.TOGGLE_SELECTED(tree, node, $event);
        } else {
          this.setPath(node);
        }
        TREE_ACTIONS.FOCUS(tree, node, $event);
      }
    },
    keys: {
      [KEYS.ENTER]: (tree, node, $event) => {
        this.setPath(node);
        TREE_ACTIONS.FOCUS(tree, node, $event);  
      }
    }
  }

  customTemplateStringOptions = {
    useCheckbox: false,
    displayField: this.displayFieldName,
    isExpandedField: 'expanded',
    idField: 'uuid',
    getChildren: this.getChildren.bind(this),
    actionMapping: this.actionMapping,
    nodeHeight: 23,
    allowDrag: true,
    useVirtualScroll: false,
  }


  constructor (private entityFormService: EntityFormService,
               public translate: TranslateService){}

  ngOnInit() {
    this.treeVisible = false;

    if (this.config.multiple) {
      this.customTemplateStringOptions.useCheckbox = this.config.multiple;
    }

    if (this.config.customTemplateStringOptions) {
      if (!this.config.customTemplateStringOptions.actionMapping) {
        this.config.customTemplateStringOptions.actionMapping = this.actionMapping;
      }
      this.config.customTemplateStringOptions.explorerComponent = this;
      this.customTemplateStringOptions = this.config.customTemplateStringOptions;
      this.config.customTemplateStringOptions.explorer = this;
    }
    if(this.config.explorerType === "zvol") {
      this.displayFieldName = 'name';
      this.nodes = [{
        mountpoint: this.config.initial,
        name: this.config.initial,
        hasChildren: true
      }];
    }
    else {
      this.displayFieldName = 'subTitle';
      this.nodes = [{
        name: this.config.initial,
        subTitle: this.config.initial,
        hasChildren: true
      }];
    }
  }

  getChildren(node:any) {
    return new Promise((resolve, reject) => {
      if(this.config.explorerType === "zvol") {
        resolve(this.entityFormService.getDatasetsAndZvolsListChildren(node));
      }
      else if(this.config.explorerType === "directory") {
        resolve(this.entityFormService.getFilesystemListdirChildren(node, this.config.explorerType, this.config.hideDirs ));
      }
      else if(this.config.explorerType === "file") {
        resolve(this.entityFormService.getFilesystemListdirChildren(node));
      }
      else {
        resolve(this.entityFormService.getFilesystemListdirChildren(node));
      }     
    });
  }
  
  
  private toggleTree() {
    this.treeVisible = !this.treeVisible;
  }

  setPath(node:any) {
    if(this.config.explorerType === "zvol") {
      if(!node.data.mountpoint) {
        node.data.mountpoint = this.config.initial + "/" + node.data.path;
      }
      this.group.controls[this.config.name].setValue(node.data.mountpoint);
    }
    else {
      this.group.controls[this.config.name].setValue(node.data.name);
    }
  }

  onClick(event) {
    const selectedTreeNodes = Object.entries(event.treeModel.selectedLeafNodeIds)
     .filter(([key, value]) => {
            return (value === true);
      }).map((node) => event.treeModel.getNodeById(node[0]));
    this.valueHandler(selectedTreeNodes);
  }

  valueHandler(selectedTreeNodes) {
    let res = [];
    for (let i = 0; i < selectedTreeNodes.length; i++) {
        if (selectedTreeNodes[i].parent.isAllSelected) {
          let parent = selectedTreeNodes[i];
          while (parent && parent.isRoot != true && parent.parent && !parent.parent.isRoot && parent.parent.isAllSelected) {
            parent = parent.parent;
          }
          if (res.indexOf(parent.data.name) === -1) {
            res.push(parent.data.name);
          }
        } else if (selectedTreeNodes[i].isAllSelected) {
          res.push(selectedTreeNodes[i].data.name);
        }
    }
    this.group.controls[this.config.name].setValue(res);
  }
}
