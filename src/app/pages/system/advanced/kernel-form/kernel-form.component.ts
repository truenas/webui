import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subscription } from 'rxjs';
import { helptext_system_advanced } from 'app/helptext/system/advanced';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { SystemGeneralConfig } from 'app/interfaces/system-config.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import {
  DialogService, LanguageService, StorageService,
  SystemGeneralService, WebSocketService,
} from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'app-kernel-form',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [],
})
export class KernelFormComponent implements FormConfiguration {
  queryCall = 'system.advanced.config' as const;
  updateCall = 'system.advanced.update' as const;
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

  private entityForm: EntityFormComponent;
  private configData: SystemGeneralConfig;
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
    if (this.ws.connected) {
      this.loader.close();
      // ws is connected
      window.location.replace(href);
    } else {
      setTimeout(() => {
        this.reconnect(href);
      }, 5000);
    }
  }

  afterInit(entityEdit: EntityFormComponent): void {
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
