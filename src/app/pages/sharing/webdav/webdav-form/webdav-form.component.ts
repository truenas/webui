import { Component } from '@angular/core';
import { helptext_sharing_webdav, shared } from './../../../../helptext/sharing';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import * as _ from 'lodash';
import { DialogService, WebSocketService } from '../../../../services/';
import { Router } from '@angular/router';
import { T } from "app/translate-marker";

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
        },
        {
          type : 'checkbox',
          name : 'enabled',
          value: true,
          placeholder : helptext_sharing_webdav.placeholder_enabled,
          tooltip: helptext_sharing_webdav.tooltip_enabled,
        }
      ]
    }];

    constructor(protected router: Router,
      protected ws: WebSocketService, private dialog:DialogService) {}

    afterInit(entityForm: any) {
      entityForm.formGroup.controls['perm'].valueChanges.subscribe((value) => {
        value ? this.confirmSubmit = true : this.confirmSubmit = false;
      })
    };

    afterSave(entityForm) {
      this.ws.call('service.query', [[]]).subscribe((res) => {
        const service = _.find(res, {"service": "webdav"});
        if (service['enable']) {
          this.router.navigate(new Array('/').concat(
            this.route_success));
        } else {
            this.dialog.confirm(shared.dialog_title, shared.dialog_message,
            true, shared.dialog_button).subscribe((dialogRes) => {
              if (dialogRes) {
                entityForm.loader.open();
                this.ws.call('service.update', [service['id'], { enable: true }]).subscribe((updateRes) => {
                  this.ws.call('service.start', [service.service]).subscribe((startRes) => {
                    entityForm.loader.close();
                    this.dialog.Info(T('WebDAV') + shared.dialog_started_title, 
                    T('The WebDAV') + shared.dialog_started_message, '250px').subscribe(() => {
                      this.router.navigate(new Array('/').concat(
                        this.route_success));
                  })
                  }, (err) => {
                    entityForm.loader.close();
                    this.dialog.errorReport(err.error, err.reason, err.trace.formatted);
                    this.router.navigate(new Array('/').concat(
                      this.route_success));
                  });
                 }, (err) => {
                  entityForm.loader.close();
                  this.dialog.errorReport(err.error, err.reason, err.trace.formatted);
                  this.router.navigate(new Array('/').concat(
                    this.route_success));
                 });
             } else {
              this.router.navigate(new Array('/').concat(
                this.route_success));
              }
          });
        }
  
      });
    }
  }
