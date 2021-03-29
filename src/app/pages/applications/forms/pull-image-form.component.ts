import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import * as _ from 'lodash';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../common/entity/entity-form/models/fieldset.interface';
import { ModalService } from '../../../services/modal.service';
import { DialogService } from '../../../services/index';
import  helptext  from '../../../helptext/apps/apps';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';

@Component({
  selector: 'app-pull-image-form',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class PullImageFormComponent {
  protected queryCall: string = 'docker.images.query';
  protected customFilter: any[];
  protected addCall: string = 'docker.images.create';
  protected isEntity: boolean = true;
  protected entityForm: EntityFormComponent;
  private title= helptext.pullImageForm.title;
  private dialogRef: any;
  protected fieldConfig: FieldConfig[];
  public fieldSets: FieldSet[] = [
    {
      name: helptext.pullImageForm.label,
      label: true,
      width: '100%',
      config: [
        {
          type: 'input',
          name: 'username',
          placeholder: helptext.pullImageForm.username.placeholder,
          tooltip: helptext.pullImageForm.username.tooltip,
        },
        {
          type: 'input',
          name: 'password',
          placeholder: helptext.pullImageForm.password.placeholder,
          tooltip: helptext.pullImageForm.password.tooltip,
        },
      ]
    },
    {
      name:'divider',
      divider:true
    },
    {
      name: 'Name',
      width: '100%',
      config: [
        {
          type: 'input',
          name: 'image_name',
          placeholder: helptext.pullImageForm.imageName.placeholder,
          tooltip: helptext.pullImageForm.imageName.tooltip,
          required: true
        },
        {
          type: 'input',
          name: 'image_tags',
          placeholder: helptext.pullImageForm.imageTags.placeholder,
          tooltip: helptext.pullImageForm.imageTags.tooltip,
        },
      ],
    },
  ]

  constructor(private mdDialog: MatDialog, private dialogService: DialogService,
    private modalService: ModalService) {
  }

  afterModalFormClosed() {
    this.modalService.refreshTable();
  }
}
