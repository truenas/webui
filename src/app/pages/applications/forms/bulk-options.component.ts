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
  protected queryCall: string = 'kubernetes.config';
  protected editCall: string = 'kubernetes.update';
  protected isEditJob: Boolean = true;
  private title = "Bulk Options";
  private entityEdit: any;
  protected fieldConfig: FieldConfig[];
  private bulkAction;
  public hideSaveBtn = true;
  public titleBarControls;
  public controller: Subject<Control>;

  public allItems: any[];
  public selectedItems: any[];

  public fieldSets: FieldSet[] = [
    {
      name: 'chart_names',
      // label: false,
      config: [
        {
          type: 'checkbox',
          name: 'pool',
          placeholder: "Name 1",
        },        
      ]
    },
  ]


  constructor(private modalService: ModalService, private appService: ApplicationsService) { 
    this.controller = new Subject();
    this.controller.subscribe((evt:Control) => {
      console.log(evt);
      if (evt.name == 'check_all') {
        if (evt.value) {
          this.selectedItems = [...this.allItems];
        } else {
          this.selectedItems = [];
        }
        this.updateSelection();
      } else if (evt.name == 'actions') {
        this.bulkAction(this.selectedItems, evt.value.value);
      }
    })

    this.setupTitilebar();
  }

  setupTitilebar() {
    this.titleBarControls = [
      {
        name: 'check_all',
        placeholder: 'Select All',
        type: 'checkbox',
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

  setOnBulkAction(bulkAction) {
    this.bulkAction = bulkAction;
  }

  setOptions(filteredChartItems: any[]) {
    this.allItems = filteredChartItems;
    this.selectedItems = [];
    this.updateSelection();
  }

  updateSelection() {
    this.fieldSets[0].config = this.allItems.map((item) => {
      return {
        type: 'checkbox',
        name: item.name,
        placeholder: item.name,
        value: this.selectedItems.some(selectedItem => selectedItem.name == item.name)
      }
    });
  }

  preInit(entityEdit: any) {
    this.entityEdit = entityEdit;
  }
}
