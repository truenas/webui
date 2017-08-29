// import { Placeholder } from '@angular/compiler/src/i18n/i18n_ast';
import { Component } from '@angular/core';

import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'app-user-form',
  template : `<entity-form [conf]="this"></entity-form>`
})

export class WebdavFormComponent {
    protected resource_name: string = 'sharing/webdav';
    protected route_success: string[] = [ 'sharing', 'webdav' ];
    protected isEntity: boolean = true;


    public fieldConfig: FieldConfig[] = [
      {
        type : 'input',
        name : 'webdav_name',
        placeholder : 'Share Name',
      },
      {
        type : 'input',
        name : 'webdav_comment',
        placeholder : 'Comment',
      },
      {
        type : 'explorer',
        initial: '/mnt',
        name : 'webdav_path',
        placeholder : 'Path',
      },
      {
        type : 'checkbox',
        name : 'webdav_ro',
        placeholder : 'Read Only',
      },
      {
        type : 'checkbox',
        name : 'webdav_perm',
        placeholder : 'Change User & Group Ownership',
      },
    ];
}
