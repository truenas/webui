import { Component, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { helptext_system_general as helptext } from 'app/helptext/system/general';
import { helptext_system_advanced } from 'app/helptext/system/advanced';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { DialogService, LanguageService, StorageService, 
  SystemGeneralService, WebSocketService } from '../../../../services';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { ModalService } from '../../../../services/modal.service';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { EntityUtils } from '../../../common/entity/utils';

@Component({
  selector: 'app-kernel-form',
  template: `<entity-form [conf]="this"></entity-form>`,
  providers: []
})
export class KernelFormComponent implements OnDestroy{
  protected queryCall = 'system.advanced.config';
  protected updateCall = 'system.advanced.update';
  protected isOneColumnForm = true;
  private getDataFromDash: Subscription;
  public fieldConfig: FieldConfig[] = []

  public fieldSets: FieldSet[] = [
    {
      name: helptext_system_advanced.fieldset_kernel,
      label: false,
      class: 'console',
      config: [
        {
          type: 'checkbox',
          name: 'autotune',
          placeholder: helptext_system_advanced.autotune_placeholder,
          tooltip: helptext_system_advanced.autotune_tooltip
        },
        {
          type: 'checkbox',
          name: 'debugkernel',
          placeholder: helptext_system_advanced.debugkernel_placeholder,
          tooltip: helptext_system_advanced.debugkernel_tooltip
        },
      ]
    },
    { 
      name:'divider',
      divider: true 
    }
  ];

  private entityForm: any;
  private configData: any;
  protected title = helptext_system_advanced.fieldset_kernel;

  constructor(
    protected router: Router,
    protected language: LanguageService,
    protected ws: WebSocketService,
    protected dialog: DialogService,
    protected loader: AppLoaderService,
    public http: HttpClient,
    protected storage: StorageService,
    private sysGeneralService: SystemGeneralService,
    private modalService: ModalService
  ) {
    this.getDataFromDash = this.sysGeneralService.sendConfigData$.subscribe(res => {
      this.configData = res;
    })
  }

  reconnect(href) {
    if (this.entityForm.ws.connected) {
      this.loader.close();
      // ws is connected
      window.location.replace(href);
    } else {
      setTimeout(() => {
        this.reconnect(href);
      }, 5000);
    }
  }

  afterInit(entityEdit: any) {
    this.entityForm = entityEdit;
  }

   public customSubmit(body) {
    this.loader.open();
    return this.ws.call('system.advanced.update', [body]).subscribe(() => {
      this.loader.close();
      this.entityForm.success = true;
      this.entityForm.formGroup.markAsPristine();
      this.modalService.close('slide-in-form');
      this.sysGeneralService.refreshSysGeneral();
    }, (res) => {
      this.loader.close();
      new EntityUtils().handleWSError(this.entityForm, res);
    });
  }

  getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
  }

  ngOnDestroy() {
    this.getDataFromDash.unsubscribe();
  }

}
