import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { SystemGeneralService, WebSocketService } from '../../../../services';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { ModalService } from '../../../../services/modal.service';
import { EntityUtils } from '../../../common/entity/utils';
import { FieldSets } from 'app/pages/common/entity/entity-form/classes/field-sets';
import { T } from 'app/translate-marker';
import _ from 'lodash';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { Formconfiguration } from 'app/pages/common/entity/entity-form/entity-form.component';
import { AdvancedConfig } from 'app/interfaces/advanced-config'

@Component({
  selector: 'app-isolated-pcis-form',
  template: `<entity-form [conf]="this"></entity-form>`,
  providers: []
})
export class IsolatedGpuPcisFormComponent implements Formconfiguration {
  public queryCall = 'system.advanced.config';
  public updateCall = 'system.advanced.update';
  public isOneColumnForm = true;
  private advancedConfig: Object;

  public fieldSets = new FieldSets([
    {
      name: T("Isolated GPU PCI Id's"),
      label: false,
      class: 'isolated-pcis',
      config: [
        {
            type: 'select',
            placeholder: T("Isolated GPU PCI Id's"),
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

  private entityForm: EntityFormComponent;
  public title = T("Isolated GPU PCI Id's");

  constructor(
    protected ws: WebSocketService,
    protected loader: AppLoaderService,
    private sysGeneralService: SystemGeneralService,
    private modalService: ModalService
  ) { }

  afterInit(entityForm: EntityFormComponent) {
    this.entityForm = entityForm;
    
    this.ws.call("device.gpu_pci_ids_choices").subscribe((pci_choices: Object) => {
      const isolatedGpuPciIdsConf = this.fieldSets.config("isolated_gpu_pci_ids");
      for(let key in pci_choices) {
          isolatedGpuPciIdsConf.options.push({label: key, value: pci_choices[key]})
      }
      this.entityForm.formGroup.controls['isolated_gpu_pci_ids'].setValue(this.advancedConfig['isolated_gpu_pci_ids']);
    });
    this.sysGeneralService.getAdvancedConfig.subscribe((adv_conf: AdvancedConfig) => {
        this.advancedConfig = adv_conf;
    })
    
    const isolatedGpuPciIdsControl =  this.entityForm.formGroup.controls['isolated_gpu_pci_ids'];
    isolatedGpuPciIdsControl.valueChanges.subscribe((isolated_pci_ids) => {
        const isolatedGpuPciIdsConf = this.fieldSets.config("isolated_gpu_pci_ids");
        if(isolated_pci_ids.length >= isolatedGpuPciIdsConf.options.length) {
            isolatedGpuPciIdsConf.warnings = "A minimum of 2 GPUs are required in the host to ensure that host has at least 1 GPU available.";
            isolatedGpuPciIdsControl.setErrors({ maxPCIIds: true})
        } else if(isolated_pci_ids.length > 0) {
            isolatedGpuPciIdsConf.warnings = null;
            isolatedGpuPciIdsControl.setErrors(null);
        }
    });

    
  }

  public customSubmit(body: AdvancedConfig) {
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
}
