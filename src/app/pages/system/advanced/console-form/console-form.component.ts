import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subscription } from 'rxjs';
import { helptext_system_advanced } from 'app/helptext/system/advanced';
import { AdvancedConfigUpdate } from 'app/interfaces/advanced-config.interface';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { SystemGeneralConfig } from 'app/interfaces/system-config.interface';
import { FieldSets } from 'app/pages/common/entity/entity-form/classes/field-sets';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FieldConfig, FormSelectConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { RelationAction } from 'app/pages/common/entity/entity-form/models/relation-action.enum';
import { EntityUtils } from 'app/pages/common/entity/utils';
import {
  DialogService, LanguageService, StorageService,
  SystemGeneralService, WebSocketService,
} from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'app-console-form',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [],
})
export class ConsoleFormComponent implements FormConfiguration {
  queryCall = 'system.advanced.config' as const;
  updateCall = 'system.advanced.update' as const;
  protected isOneColumnForm = true;
  fieldConfig: FieldConfig[] = [];

  fieldSets = new FieldSets([
    {
      name: helptext_system_advanced.fieldset_console,
      label: false,
      class: 'console',
      config: [
        {
          type: 'checkbox',
          name: 'consolemenu',
          placeholder: helptext_system_advanced.consolemenu_placeholder,
          tooltip: helptext_system_advanced.consolemenu_tooltip,
        },
        {
          type: 'checkbox',
          name: 'serialconsole',
          placeholder: helptext_system_advanced.serialconsole_placeholder,
          tooltip: helptext_system_advanced.serialconsole_tooltip,
        },
        {
          type: 'select',
          name: 'serialport',
          placeholder: helptext_system_advanced.serialport_placeholder,
          options: [],
          tooltip: helptext_system_advanced.serialport_tooltip,
          relation: [{
            action: RelationAction.Disable,
            when: [{
              name: 'serialconsole',
              value: false,
            }],
          }],
        },
        {
          type: 'select',
          name: 'serialspeed',
          placeholder: helptext_system_advanced.serialspeed_placeholder,
          options: [
            { label: '9600', value: '9600' },
            { label: '19200', value: '19200' },
            { label: '38400', value: '38400' },
            { label: '57600', value: '57600' },
            { label: '115200', value: '115200' },
          ],
          tooltip: helptext_system_advanced.serialspeed_tooltip,
          relation: [{
            action: RelationAction.Disable,
            when: [{
              name: 'serialconsole',
              value: false,
            }],
          }],
        },
        {
          type: 'textarea',
          name: 'motd',
          placeholder: helptext_system_advanced.motd_placeholder,
          tooltip: helptext_system_advanced.motd_tooltip,
        },
      ],
    },
    {
      name: 'divider',
      divider: true,
    },
  ]);

  private entityForm: EntityFormComponent;
  private configData: SystemGeneralConfig;
  title = helptext_system_advanced.fieldset_console;

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

    this.ws.call('system.advanced.serial_port_choices').pipe(untilDestroyed(this)).subscribe((serialPorts) => {
      const serialport = this.fieldSets.config('serialport') as FormSelectConfig;
      serialport.options = [];

      for (const k in serialPorts) {
        serialport.options.push({
          label: k, value: serialPorts[k],
        });
      }
    });
  }

  customSubmit(body: Partial<AdvancedConfigUpdate>): Subscription {
    this.loader.open();
    return this.ws.call('system.advanced.update', [body]).pipe(untilDestroyed(this)).subscribe(() => {
      this.loader.close();
      this.entityForm.success = true;
      this.entityForm.formGroup.markAsPristine();
      this.modalService.closeSlideIn();
      this.sysGeneralService.refreshSysGeneral();
    }, (res) => {
      this.loader.close();
      new EntityUtils().handleWSError(this.entityForm, res);
    });
  }
}
