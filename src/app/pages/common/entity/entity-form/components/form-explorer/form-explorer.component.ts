import {Component, ViewContainerRef, OnInit} from '@angular/core';
import {FormGroup} from '@angular/forms';
import { TreeModel } from 'ng2-tree';

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
  

  ngOnInit() {

  };
}


