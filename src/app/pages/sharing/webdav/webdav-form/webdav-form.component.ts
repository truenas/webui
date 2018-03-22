// import { Placeholder } from '@angular/compiler/src/i18n/i18n_ast';
import { Component } from '@angular/core';

import { T } from '../../../../translate-marker';
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
        placeholder : T('Share Name'),
        tooltip: T('Input a name for the share.')
      },
      {
        type : 'input',
        name : 'webdav_comment',
        placeholder : T('Comment'),
        tooltip: T('Optional.')
      },
      {
        type : 'explorer',
        initial: '/mnt',
        name : 'webdav_path',
        explorerType: 'directory',
        placeholder : T('Path'),
        tooltip: T('Browse to the volume or dataset to share.')
      },
      {
        type : 'checkbox',
        name : 'webdav_ro',
        placeholder : T('Read Only'),
        tooltip: T('If checked, users cannot write to the share.')
      },
      {
        type : 'checkbox',
        name : 'webdav_perm',
        placeholder : T('Change User & Group Ownership'),
        tooltip: T('If checked, automatically sets the contents of the\
 share to the <i>webdav</i> user and group.')
      },
    ];
}
