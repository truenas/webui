import {ApplicationRef, Component, Injector} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import { FormControl } from '@angular/forms';
import * as _ from 'lodash';
import {
  FieldConfig
} from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { T } from '../../../translate-marker';
import helptext from './../../../helptext/vm/vm-wizard/vm-wizard';
import globalHelptext from './../../../helptext/global-helptext';
import {WebSocketService, StorageService, VmService, ValidationService} from '../../../services/';
import { Validators } from '@angular/forms';

@Component({
  selector : 'app-vm',
  template : `<entity-form [conf]="this"></entity-form>`,
  providers: [StorageService]

})
export class VmFormComponent {
  protected queryCall = 'vm.query';
  protected editCall = 'vm.update';
  protected isEntity = true;
  protected route_success: string[] = [ 'vm' ];
  protected entityForm: any;
  protected save_button_enabled: boolean;
  public vcpus: number;
  public cores: number;
  public threads: number;
  protected queryCallOption: Array<any> = [];

  public fieldConfig: FieldConfig[] = []
  public fieldSets: FieldSet[] = [
      {
        name: helptext.vm_form_title,
        class: 'vm_settings',
        label:true,
        config:[
        { 
          type: 'input', 
          name: 'name', 
          placeholder: helptext.name_placeholder, 
          tooltip: helptext.name_tooltip
        },
        { 
          type: 'input', 
          name : 'description', 
          placeholder : helptext.description_placeholder, 
          tooltip: helptext.description_tooltip
        },
        {
          name: 'time',
          placeholder: helptext.time_placeholder,
          tooltip: helptext.time_tooltip,
          type: 'select',
          options: [{ label: helptext.time_local_text, value: 'LOCAL'}, { label: helptext.time_utc_text, value: 'UTC' }]
        },
        { 
          type : 'input', 
          name: 'vcpus',
          inputType: 'number',
          placeholder : helptext.vcpus_placeholder, 
          tooltip: helptext.vcpus_tooltip,
          validation: [Validators.required, Validators.min(1), Validators.max(16), this.cpuValidator('threads'),]
        },
        { 
          type : 'input', 
          name: 'cores',
          inputType: 'number',
          placeholder : helptext.cores.placeholder, 
          tooltip: helptext.cores.tooltip,
          validation: [Validators.required, Validators.min(1), Validators.max(16), this.cpuValidator('threads'),]
        },
        { 
          type : 'input', 
          name: 'threads',
          inputType: 'number',
          placeholder : helptext.threads.placeholder, 
          tooltip: helptext.threads.tooltip,
          validation: [Validators.required, Validators.min(1), Validators.max(16), this.cpuValidator('threads'),]
        },
        { 
          type: 'input', 
          name : 'memory', 
          placeholder : `${helptext.memory_placeholder} ${globalHelptext.human_readable.suggestion_label}`,
          tooltip: helptext.memory_tooltip,
          blurStatus : true,
          blurEvent : this.blurEvent,
          parent : this
        },
        { 
          type: 'select', 
          name : 'bootloader', 
          placeholder : helptext.bootloader_placeholder, 
          tooltip: helptext.bootloader_tooltip,options: []
        },
        { 
          type: 'checkbox', 
          name : 'autostart', 
          placeholder : helptext.autostart_placeholder, 
          tooltip: helptext.autostart_tooltip
        }
      ]
    }
  ]
  private bootloader: any;
  public bootloader_type: any[];

  constructor(protected router: Router,
              protected ws: WebSocketService, protected storageService: StorageService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected vmService: VmService, protected route: ActivatedRoute
              ) {}

  preInit(entityForm: any) {
    this.entityForm = entityForm;
    this.route.params.subscribe(params => {
      if (params['pk']) {
        let opt = params.pk ? ['id', "=", parseInt(params.pk, 10)] : [];
        this.queryCallOption = [opt]
        }
      })
  }

  afterInit(entityForm: any) {
    this.bootloader =_.find(this.fieldConfig, {name : 'bootloader'});
    this.vmService.getBootloaderOptions().forEach((item) => {
      this.bootloader.options.push({label : item[1], value : item[0]})
    });

    entityForm.formGroup.controls['memory'].valueChanges.subscribe((value) => {
      const mem = _.find(this.fieldConfig, {name: "memory"});
      if (typeof(value) === 'number') {
        value = value.toString();
      }
      const filteredValue = this.storageService.convertHumanStringToNum(value);
      mem['hasErrors'] = false;
      mem['errors'] = '';
      if (isNaN(filteredValue)) {
          mem['hasErrors'] = true;
          mem['errors'] = globalHelptext.human_readable.input_error;
      };
    });

    entityForm.formGroup.controls['vcpus'].valueChanges.subscribe((value) => {
      this.vcpus = value;
    })
    entityForm.formGroup.controls['cores'].valueChanges.subscribe((value) => {
      this.cores = value;
    })
    entityForm.formGroup.controls['threads'].valueChanges.subscribe((value) => {
      this.threads = value;
    })
  }

  blurEvent(parent){
    if (parent.entityForm) {
      parent.entityForm.formGroup.controls['memory'].setValue(parent.storageService.humanReadable)
      let valString = (parent.entityForm.formGroup.controls['memory'].value);
      let valBytes = Math.round(parent.storageService.convertHumanStringToNum(valString)/1048576);
      if (valBytes < 256) {
        const mem = _.find(parent.fieldConfig, {name: "memory"});
        mem['hasErrors'] = true;
        mem['errors'] = helptext.memory_size_err;
      }
    }
  }

  cpuValidator(name: string) { 
    const self = this;
    return function validCPU(control: FormControl) {
      const config = self.fieldConfig.find(c => c.name === name);
        setTimeout(() => {
          const errors = self.vcpus * self.cores * self.threads > 16
          ? { validCPU : true }
          : null;
  
          if (errors) {
            config.hasErrors = true;
            config.warnings = T(`The product of vCPUs, cores, and threads must not exceed 16.`);
          } else {
            config.hasErrors = false;
            config.warnings = '';
          }
          return errors;
        }, 100)
    }
  };

  resourceTransformIncomingRestData(wsResponse) {
    wsResponse['memory'] = this.storageService.convertBytestoHumanReadable(wsResponse['memory']*1048576, 0);
    return wsResponse;
  }

  beforeSubmit(data) {
    if (data['memory'] !== undefined && data['memory'] !== null) {
    data['memory'] = Math.round(this.storageService.convertHumanStringToNum(data['memory'])/1048576);
    }
  }

}
