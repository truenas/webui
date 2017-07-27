import {Component, ViewContainerRef, OnInit} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {EntityFormService} from '../../services/entity-form.service';
import {TreeModel, NodeEvent} from 'ng2-tree';

import {FieldConfig} from '../../models/field-config.interface';
import {Field} from '../../models/field.interface';
import {TooltipComponent} from '../tooltip/tooltip.component';

@Component({
  selector : 'form-explorer',
  templateUrl : './form-explorer.component.html',
  styleUrls : [ '../dynamic-field/dynamic-field.css' ],
})
export class FormExplorerComponent implements Field, OnInit {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;

  private tree: TreeModel;
  private treeVisible: boolean = false;

constructor (private entityFormService : EntityFormService){}

  ngOnInit() {
    this.tree ={ value: this.config.initial,
    children: this.entityFormService.getFilesystemListdir(this.config.initial)
    }
  };

  private onNodeSelected(e: NodeEvent): void {
    this.config.value = e.node.node['path'];
  }
  
  private toggleTree() {
    this.treeVisible = !this.treeVisible;
  }
}


