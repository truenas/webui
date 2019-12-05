import { Component } from '@angular/core';
import { helptext_sharing_webdav } from './../../../../helptext/sharing';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';

@Component({
  selector : 'app-user-form',
  template : `<entity-form [conf]="this"></entity-form>`
})

export class WebdavFormComponent {
    protected queryCall = 'sharing.webdav.query';
    protected queryKey = 'id';
    protected addCall = 'sharing.webdav.create';
    protected editCall = 'sharing.webdav.update';
    protected route_success: string[] = [ 'sharing', 'webdav' ];
    protected isEntity: boolean = true;

    public confirmSubmit = true;
    public confirmSubmitDialog = {
      title: helptext_sharing_webdav.warning_dialog_title,
      message: helptext_sharing_webdav.warning_dialog_message,
      hideCheckbox: false
    }

    public fieldConfig: FieldConfig[] = []
    public fieldSetDisplay  = 'default';
    protected fieldSets: FieldSet[] = [
      {
        name: helptext_sharing_webdav.fieldset_name,
        class: 'webdav-configuration-form',
        label:true,
        config: [
        {
          type : 'input',
          name : 'name',
          placeholder : helptext_sharing_webdav.placeholder_name,
          tooltip: helptext_sharing_webdav.tooltip_name,
          required: true,
          validation : helptext_sharing_webdav.validator_name
        },
        {
          type : 'input',
          name : 'comment',
          placeholder : helptext_sharing_webdav.placeholder_comment,
          tooltip: helptext_sharing_webdav.tooltip_comment
        },
        {
          type : 'explorer',
          initial: '/mnt',
          name : 'path',
          explorerType: 'directory',
          placeholder : helptext_sharing_webdav.placeholder_path,
          tooltip: helptext_sharing_webdav.tooltip_path,
          required: true,
          validation : helptext_sharing_webdav.validator_path
        },
        {
          type : 'checkbox',
          name : 'ro',
          placeholder : helptext_sharing_webdav.placeholder_ro,
          tooltip: helptext_sharing_webdav.tooltip_ro
        },
        {
          type : 'checkbox',
          name : 'perm',
          value: true,
          placeholder : helptext_sharing_webdav.placeholder_perm,
          tooltip: helptext_sharing_webdav.tooltip_perm
        }
      ]
    }];

    afterInit(entityForm: any) {
      entityForm.formGroup.controls['perm'].valueChanges.subscribe((value) => {
        value ? this.confirmSubmit = true : this.confirmSubmit = false;
      })
    };
  }
