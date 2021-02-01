import { Component } from '@angular/core';
import * as _ from 'lodash';

import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../common/entity/entity-form/models/fieldset.interface';
import { ModalService } from 'app/services/modal.service';
import  helptext  from '../../../helptext/apps/apps';
import { ApplicationsService } from '../applications.service';
import { Subject } from 'rxjs';
import { Control } from 'app/pages/common/entity/entity-toolbar/models/control.interface';

@Component({
  selector: 'bulk-options',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class BulkOptionsComponent {
  protected fieldConfig: FieldConfig[];
  private bulkAction;
  public hideSaveBtn = true;
  public titleBarControls;
  public controller: Subject<Control>;
  public entityForm: any;
  public allItems: any[];
  public selectedItems: any[];
  public parent: any;
  public fieldSets: FieldSet[] = [
    {
      name: 'chart_names',
      config: []
    },
  ];

  constructor(private modalService: ModalService, private appService: ApplicationsService) { 
    this.controller = new Subject();
    this.controller.subscribe((evt:Control) => {
      if (evt.name == 'check_all') {
        this.updateSelection(evt.value);
      } else if (evt.name == 'actions') {
        this.parent.onBulkAction(this.getSelectedItems(), evt.value.value);
      }
    })

    this.setupTitilebar();
  }

  getSelectedItems() {
    const selectedItems = [];
    for (let [key, value] of Object.entries(this.entityForm.formGroup.value)) {
      if (value) {
        selectedItems.push(key);
      }
    }   
    return selectedItems;
  }

  setupTitilebar() {
    this.titleBarControls = [
      {
        name: 'check_all',
        placeholder: 'Select All',
        type: 'checkbox',
        class: 'bulk',
      },
      {
        name: 'actions',
        label: 'Actions',
        type: 'menu',
        options: [
          { label: 'Start', value: 'start' },
          { label: 'Stop', value: 'stop' },
          { label: 'Delete', value: 'delete' },
        ]
      }
    ];
  }

  setParent(parent) {
    this.parent = parent;
    this.allItems = this.parent.filteredChartItems;
    this.selectedItems = [];
    this.fieldSets[0].config = this.allItems.map((item) => {
      return {
        type: 'checkbox',
        name: item.name,
        placeholder: item.name,
        parent: this,
        updater: () => {
          this.selectedItems = this.allItems.filter(item => this.entityForm.formGroup.value[item.name])
        },
      }
    });
  }

  setOptions(filteredChartItems: any[]) {
    this.allItems = filteredChartItems;
    this.selectedItems = [];
    this.fieldSets[0].config = this.allItems.map((item) => {
      return {
        type: 'checkbox',
        name: item.name,
        placeholder: item.name,
        parent: this,
        updater: () => {
          this.selectedItems = this.allItems.filter(item => this.entityForm.formGroup.value[item.name])
        },
      }
    });
  }

  afterInit(entityForm: any) {
    this.entityForm = entityForm;
  }

  updateSelection(selected) {
    this.allItems.forEach((item) => {
      this.entityForm.formGroup.controls[item.name].setValue(selected);
    });
  }

}
