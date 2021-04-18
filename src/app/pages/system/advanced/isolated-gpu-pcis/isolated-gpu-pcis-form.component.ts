import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { SystemGeneralService, WebSocketService } from '../../../../services';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { ModalService } from '../../../../services/modal.service';
import { EntityUtils } from '../../../common/entity/utils';
import { FieldSets } from 'app/pages/common/entity/entity-form/classes/field-sets';
import { T } from 'app/translate-marker';
import _ from 'lodash';

@Component({
  selector: 'app-isolated-pcis-form',
  template: `<entity-form [conf]="this"></entity-form>`,
  providers: []
})
export class IsolatedGpuPcisFormComponent {
  protected queryCall = 'system.advanced.config';
  protected updateCall = 'system.advanced.update';
  protected isOneColumnForm = true;
  private advancedConfig: Object;

  public fieldSets = new FieldSets([
    {
      name: T("Isolated GPU PCI IDs"),
      label: false,
      class: 'isolated-pcis',
      config: [
        {
            type: 'select',
            placeholder: T("Isolated PCI ID's"),
            name: 'isolated_gpu_pci_ids',
            multiple: true,
            required: true,
            options: []
        }
      ]
    },
    { 
      name:'divider',
      divider: true 
    }
  ]);

  private entityForm: any;
  protected title = T("Isolated GPU PCI IDs");

  constructor(
    protected ws: WebSocketService,
    protected loader: AppLoaderService,
    private sysGeneralService: SystemGeneralService,
    private modalService: ModalService
  ) { }

  preInit() {}

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
    
    this.ws.call("device.gpu_pci_ids_choices").subscribe((pci_choices: Object) => {
        const isolated_gpu_pci_ids_conf = this.fieldSets.config("isolated_gpu_pci_ids");
        for(let key in pci_choices) {
            isolated_gpu_pci_ids_conf.options.push({label: key, value: pci_choices[key]})
        }
        this.entityForm.formGroup.controls['isolated_gpu_pci_ids'].setValue(this.advancedConfig['isolated_gpu_pci_ids']);
    });
    this.sysGeneralService.getAdvancedConfig.subscribe(adv_conf => {
        this.advancedConfig = adv_conf;
    })
    
    const isolated_gpu_pci_ids_control =  this.entityForm.formGroup.controls['isolated_gpu_pci_ids'];
    isolated_gpu_pci_ids_control.valueChanges.subscribe((isolated_pci_ids) => {
        const isolated_gpu_pci_ids_conf = this.fieldSets.config("isolated_gpu_pci_ids");
        if(isolated_pci_ids.length >= isolated_gpu_pci_ids_conf.options.length) {
            isolated_gpu_pci_ids_conf.warnings = "A minimum of 2 GPUs are required in the host to ensure that host has at least 1 GPU available.";
            isolated_gpu_pci_ids_control.setErrors({ maxPCIIds: true})
        } else if(isolated_pci_ids.length > 0) {
            isolated_gpu_pci_ids_conf.warnings = null;
            isolated_gpu_pci_ids_control.setErrors(null);
        }
    });

    
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
}
