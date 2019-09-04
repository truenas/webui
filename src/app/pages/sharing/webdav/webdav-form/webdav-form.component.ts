import { Component } from '@angular/core';
import { helptext_sharing_webdav } from './../../../../helptext/sharing';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'app-user-form',
  template : `<entity-form [conf]="this"></entity-form>`
})

export class WebdavFormComponent {
    protected resource_name: string = 'sharing/webdav';
    protected route_success: string[] = [ 'sharing', 'webdav' ];
    protected isEntity: boolean = true;

    public confirmSubmit = true;
    public confirmSubmitDialog = {
      title: helptext_sharing_webdav.warning_dialog_title,
      message: helptext_sharing_webdav.warning_dialog_message,
      hideCheckbox: false
    }

    public fieldConfig: FieldConfig[] = [
      {
        type : 'input',
        name : 'webdav_name',
        placeholder : helptext_sharing_webdav.placeholder_name,
        tooltip: helptext_sharing_webdav.tooltip_name,
        required: true,
        validation : helptext_sharing_webdav.validator_name
      },
      {
        type : 'input',
        name : 'webdav_comment',
        placeholder : helptext_sharing_webdav.placeholder_comment,
        tooltip: helptext_sharing_webdav.tooltip_comment
      },
      {
        type : 'explorer',
        initial: '/mnt',
        name : 'webdav_path',
        explorerType: 'directory',
        placeholder : helptext_sharing_webdav.placeholder_path,
        tooltip: helptext_sharing_webdav.tooltip_path,
        required: true,
        validation : helptext_sharing_webdav.validator_path
      },
      {
        type : 'checkbox',
        name : 'webdav_ro',
        placeholder : helptext_sharing_webdav.placeholder_ro,
        tooltip: helptext_sharing_webdav.tooltip_ro
      },
      {
        type : 'checkbox',
        name : 'webdav_perm',
        value: true,
        placeholder : helptext_sharing_webdav.placeholder_perm,
        tooltip: helptext_sharing_webdav.tooltip_perm
      }
    ];

    afterInit(entityForm: any) {
      entityForm.formGroup.controls['webdav_perm'].valueChanges.subscribe((value) => {
        value ? this.confirmSubmit = true : this.confirmSubmit = false;
      })
    };
  }
