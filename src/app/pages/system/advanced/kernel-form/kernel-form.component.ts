import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { helptext_system_advanced } from 'app/helptext/system/advanced';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { Subscription } from 'rxjs';
import {
  DialogService, LanguageService, StorageService,
  SystemGeneralService, WebSocketService,
} from '../../../../services';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { ModalService } from '../../../../services/modal.service';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { EntityUtils } from '../../../common/entity/utils';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'app-kernel-form',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [],
})
export class KernelFormComponent implements FormConfiguration {
  queryCall: 'system.advanced.config' = 'system.advanced.config';
  updateCall = 'system.advanced.update';
  protected isOneColumnForm = true;
  fieldConfig: FieldConfig[] = [];

  fieldSets: FieldSet[] = [
    {
      name: helptext_system_advanced.fieldset_kernel,
      label: false,
      class: 'console',
      config: [
        {
          type: 'checkbox',
          name: 'autotune',
          placeholder: helptext_system_advanced.autotune_placeholder,
          tooltip: helptext_system_advanced.autotune_tooltip,
        },
        {
          type: 'checkbox',
          name: 'debugkernel',
          placeholder: helptext_system_advanced.debugkernel_placeholder,
          tooltip: helptext_system_advanced.debugkernel_tooltip,
        },
      ],
    },
    {
      name: 'divider',
      divider: true,
    },
  ];

  private entityForm: any;
  private configData: any;
  title = helptext_system_advanced.fieldset_kernel;

  constructor(
    protected router: Router,
    protected language: LanguageService,
    protected ws: WebSocketService,
    protected dialog: DialogService,
    protected loader: AppLoaderService,
    public http: HttpClient,
    protected storage: StorageService,
    private sysGeneralService: SystemGeneralService,
    private modalService: ModalService,
  ) {
    this.sysGeneralService.sendConfigData$.pipe(untilDestroyed(this)).subscribe((res) => {
      this.configData = res;
    });
  }

  reconnect(href: string): void {
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

  afterInit(entityEdit: any): void {
    this.entityForm = entityEdit;
  }

  customSubmit(body: any): Subscription {
    this.loader.open();
    return this.ws.call('system.advanced.update', [body]).pipe(untilDestroyed(this)).subscribe(() => {
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
}
