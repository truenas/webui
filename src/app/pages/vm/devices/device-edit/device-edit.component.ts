import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import * as _ from 'lodash';
import { EntityFormService } from '../../../../pages/common/entity/entity-form/services/entity-form.service';
import { TranslateService } from '@ngx-translate/core';

import { RestService, WebSocketService, SystemGeneralService, NetworkService } from '../../../../services/';
import { EntityUtils } from '../../../common/entity/utils';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import helptext from '../../../../helptext/vm/devices/device-add-edit';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
@Component({
  selector : 'app-device-edit',
  templateUrl : './device-edit.component.html',
  styleUrls: ['./device-edit.component.scss'],
})
export class DeviceEditComponent implements OnInit {

  protected updateCall = 'vm.device.update';
  protected route_success: string[];
  public deviceid: any;
  public vmname: any;
  public fieldSets: any;
  public isCustActionVisible = false;
  protected ipAddress: any = [];
  public selectedType = 'CDROM';
  public formGroup: any;
  public activeFormGroup: any;
  public cdromFormGroup: any;
  public diskFormGroup: any;
  public nicFormGroup: any;
  public rawfileFormGroup: any;
  public vncFormGroup: any;
  public rootpwd: any;
  public vminfo: any;
  public boot: any;
  public error_reason: string;

  public custActions: any[];

  public fieldConfig: FieldConfig[] = [
    {
      type: 'select',
      name: 'dtype',
      placeholder: helptext.dtype_placeholder,
      options: [
        {
        label: 'CD-ROM',
        value: 'CDROM',
        }, {
        label: 'NIC',
        value: 'NIC',
        }, {
        label: 'Disk',
        value: 'DISK',
        }, {
        label: 'Raw File',
        value: 'RAW',
        }, {
        label: 'VNC',
        value: 'VNC',
        }
      ], 
      value: helptext.dtype_value,
      required: true,
      validation: helptext.dtype_validation,
      isHidden: true
    }
  ];

  // cd-rom
  public cdromFieldConfig: FieldConfig[] = [
    {
      type : 'explorer',
      initial: '/mnt',
      name : 'path',
      placeholder : helptext.cd_path_placeholder,
      tooltip : helptext.cd_path_tooltip,
      validation : helptext.cd_path_validation,
      required: true,
      disabled: false
    },
    {
      name : 'order',
      placeholder : helptext.order_placeholder,
      tooltip : helptext.order_tooltip,
      type: 'input',
      value: null,
      inputType: 'number'
    },
  ];
  //disk 
  public diskFieldConfig: FieldConfig[] = [
    {
      name : 'path',
      placeholder : helptext.zvol_path_placeholder,
      tooltip : helptext.zvol_path_tooltip,
      type: 'select',
      required: true,
      validation : helptext.zvol_path_validation,
      options:[],
      disabled: false
    },
    {
      name : 'type',
      placeholder : helptext.mode_placeholder,
      tooltip : helptext.mode_tooltip,
      type: 'select',
      options : helptext.mode_options,
    },
    {
      name : 'sectorsize',
      placeholder : helptext.sectorsize_placeholder,
      tooltip : helptext.sectorsize_tooltip,
      type: 'select',
      options: helptext.sectorsize_options,
      value: 0
    },
    {
      name : 'order',
      placeholder : helptext.order_placeholder,
      tooltip : helptext.order_tooltip,
      type: 'input',
      value: null,
      inputType: 'number'
    },
  ];
  //nic
  public nicFieldConfig: FieldConfig[] = [
    {
      name: 'type',
      placeholder: helptext.adapter_type_placeholder,
      tooltip: helptext.adapter_type_tooltip,
      type: 'select',
      options: [],
      validation: helptext.adapter_type_validation,
      required: true,
      disabled: false
    },
    {
      name: 'mac',
      placeholder: helptext.mac_placeholder,
      tooltip: helptext.mac_tooltip,
      type: 'input',
      value: helptext.mac_value,
      validation: helptext.mac_validation,
    },
    {
      name: 'nic_attach',
      placeholder: helptext.nic_attach_placeholder,
      tooltip: helptext.nic_attach_tooltip,
      type: 'select',
      options: [],
      validation: helptext.nic_attach_validation,
      required: true
    },
    {
      name : 'order',
      placeholder : helptext.order_placeholder,
      tooltip : helptext.order_tooltip,
      type: 'input',
      value: null,
      inputType: 'number'
    },
  ];
  protected nic_attach: any;
  protected nicType: any;
  protected nicMac: any;

  //rawfile
  public rawfileFieldConfig: FieldConfig[] = [
    {
      type : 'explorer',
      initial: '/mnt',
      name : 'path',
      placeholder : helptext.raw_file_path_placeholder,
      tooltip : helptext.raw_file_path_tooltip,
      required: true,
      validation: helptext.raw_file_path_validation,
      disabled: false
    },
    {
      type : 'select',
      name : 'sectorsize',
      placeholder : helptext.sectorsize_placeholder,
      tooltip : helptext.sectorsize_tooltip,
      options: helptext.sectorsize_options,
      value: 0
    },
    {
      name : 'type',
      placeholder : helptext.mode_placeholder,
      tooltip : helptext.mode_tooltip,
      type: 'select',
      options : helptext.mode_options,
    },
    {
      name : 'order',
      placeholder : helptext.order_placeholder,
      tooltip : helptext.order_tooltip,
      type: 'input',
      value: null,
      inputType: 'number'
    },
    {
      type : 'input',
      name : 'size',
      placeholder : helptext.raw_size_placeholder,
      tooltip : helptext.raw_size_tooltip,
      inputType : 'number',
    },
    {
      type : 'input',
      name : 'rootpwd',
      placeholder : helptext.rootpwd_placeholder,
      tooltip : helptext.rootpwd_tooltip,
      inputType : 'password',
      isHidden: true
    },
    {
      type : 'checkbox',
      name : 'boot',
      placeholder : helptext.boot_placeholder,
      tooltip : helptext.boot_tooltip,
      isHidden: true
    },
  ];

  //vnc
  public vncFieldConfig: FieldConfig[]  = [
    {
      name : 'vnc_port',
      placeholder : helptext.vnc_port_placeholder,
      tooltip : helptext.vnc_port_tooltip,
      type : 'input',
      inputType: 'number',
      required: true,
      disabled: false
    },
    {
      name : 'wait',
      placeholder : helptext.wait_placeholder,
      tooltip : helptext.wait_tooltip,
      type: 'checkbox'
    },
    {
      name : 'vnc_resolution',
      placeholder : helptext.vnc_resolution_placeholder,
      tooltip : helptext.vnc_resolution_tooltip,
      type: 'select',
      options : helptext.vnc_resolution_options,
    },
    {
      name : 'vnc_bind',
      placeholder : helptext.vnc_bind_placeholder,
      tooltip : helptext.vnc_bind_tooltip,
      type: 'select',
      options : [],
    },
    {
      name : 'vnc_password',
      placeholder : helptext.vnc_password_placeholder,
      tooltip : helptext.vnc_password_tooltip,
      type : 'input',
      inputType : 'password',
      validation: helptext.vnc_password_validation
    },
    {
      name : 'vnc_web',
      placeholder : helptext.vnc_web_placeholder,
      tooltip : helptext.vnc_web_tooltip,
      type: 'checkbox'
    },
    {
      name : 'order',
      placeholder : helptext.order_placeholder,
      tooltip : helptext.order_tooltip,
      type: 'input',
      value: null,
      inputType: 'number'
    },
  ];

  constructor(protected router: Router,
              protected aroute: ActivatedRoute,
              protected rest: RestService,
              protected ws: WebSocketService,
              protected entityFormService: EntityFormService,
              public translate: TranslateService,
              protected loader: AppLoaderService,
              protected systemGeneralService: SystemGeneralService,
              protected networkService: NetworkService,
              private core:CoreService) {}


  preInit() {
    // vnc
    this.systemGeneralService.getIPChoices().subscribe((res) => {
      if (res.length > 0) {
        this.ipAddress = _.find(this.vncFieldConfig, {'name' : 'vnc_bind'});
        for (const item of res){
          this.ipAddress.options.push({label : item[1], value : item[0]});
        }
      }
    });

    // nic
    this.networkService.getAllNicChoices().subscribe((res) => {
      this.nic_attach = _.find(this.nicFieldConfig, { 'name': 'nic_attach' });
      res.forEach((item) => {
        this.nic_attach.options.push({ label: item[1], value: item[0] });
      });
    });
    this.ws.call('notifier.choices', ['VM_NICTYPES']).subscribe(
      (res) => {
        this.nicType = _.find(this.nicFieldConfig, { name: "type" });
        res.forEach((item) => {
          this.nicType.options.push({ label: item[1], value: item[0] });
        });
      }
    );
  }
  //Setting values coming from backend and populating formgroup with it.
  setgetValues(activeformgroup, deviceInformation) {
    for (const value in deviceInformation) {
      const fg = activeformgroup.controls[value];
      if (typeof fg !== "undefined") {
        fg.setValue(deviceInformation[value]);
      }
      else {
        console.log(deviceInformation,value,activeformgroup)
      }
      

    }
  }
  async ngOnInit() {
    this.preInit();
    this.aroute.params.subscribe(params => {
      this.deviceid = parseInt(params['pk'],10);
      this.vmname = params['name'];
      this.route_success = ['vm', params['vmid'], 'devices', this.vmname];
    });

    this.core.emit({name:"SysInfoRequest"});

    this.fieldSets = [
      {
        name:'FallBack',
        class:'fallback',
        width:'100%',
        divider:false,
        fieldConfig: this.fieldConfig,
        cdromFieldConfig: this.cdromFieldConfig,
        diskFieldConfig: this.diskFieldConfig,
        nicFieldConfig: this.nicFieldConfig,
        rawfileFieldConfig: this.rawfileFieldConfig,
        vncFieldConfig: this.vncFieldConfig,
      },
      {
        name:'divider',
        divider:true,
        width:'100%'
      }
    ];


    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);
    this.cdromFormGroup = this.entityFormService.createFormGroup(this.cdromFieldConfig);
    this.diskFormGroup = this.entityFormService.createFormGroup(this.diskFieldConfig);
    this.nicFormGroup = this.entityFormService.createFormGroup(this.nicFieldConfig);
    this.rawfileFormGroup = this.entityFormService.createFormGroup(this.rawfileFieldConfig);
    this.vncFormGroup = this.entityFormService.createFormGroup(this.vncFieldConfig);


    this.activeFormGroup = this.cdromFormGroup;
    await this.ws.call('vm.device.query',[[["id", "=", this.deviceid]]]).subscribe((res) => {
      const deviceInformation = {...res[0].attributes, ...{ 'order' : res[0].order }};
      this.vminfo = res[0];
      res = res[0].dtype;
      this.selectedType = res;
      if (res === 'CDROM') {
        this.activeFormGroup = this.cdromFormGroup;
        this.isCustActionVisible = false;
      } else if (res === 'NIC') {
        this.activeFormGroup = this.nicFormGroup;
        this.isCustActionVisible = true;
      } else if (res === 'DISK') {
        this.activeFormGroup = this.diskFormGroup;
        this.isCustActionVisible = false;
      } else if (res === 'RAW') {
        this.activeFormGroup = this.rawfileFormGroup;
        this.isCustActionVisible = false;
        // special case where RAW file device is used as a BOOT device.
        if (this.vminfo.attributes.boot && this.vminfo.attributes.rootpwd) { 
          this.rootpwd = _.find(this.rawfileFieldConfig, {'name': 'rootpwd'});
          this.rootpwd['isHidden'] = false;
          this.boot = _.find(this.rawfileFieldConfig, {'name': 'boot'});
          this.boot['isHidden'] = false;
        }
      } else if (res === 'VNC') {
        this.activeFormGroup = this.vncFormGroup;
        this.isCustActionVisible = false;
      }
      this.setgetValues(this.activeFormGroup,deviceInformation);
    });
  this.aroute.params.subscribe(params => {
      this.ws.call('vm.query',[[['id', '=', parseInt(params['vmid'] ,10)]]]).subscribe((res)=>{
        if(res[0].status.state === "RUNNING") {
          this.activeFormGroup.setErrors({ 'invalid': true });
        }
      })
    });

    this.afterInit();
  }

  afterInit() {

    this.ws.call("pool.dataset.query",[[["type", "=", "VOLUME"]]]).subscribe((zvols)=>{
      zvols.forEach(zvol => {
        _.find(this.diskFieldConfig, {name:'path'}).options.push(
          {
            label : zvol.id, value : '/dev/zvol/' + zvol.id
          }
        );   
      });
    });


    this.custActions = [
      {
        id: 'generate_mac_address',
        name: 'Generate MAC Address',
        function: () => {
          this.ws.call('vm.random_mac').subscribe((random_mac) => {
            this.nicFormGroup.controls['mac'].setValue(random_mac);
          })
        }
      }
    ];
  }

  goBack() {
    this.router.navigate(new Array('/').concat(this.route_success));
  }

  onSubmit(event: Event) {
    this.aroute.params.subscribe(params => {
      const deviceValue = _.cloneDeep(this.activeFormGroup.value);
      const deviceOrder = deviceValue['order'];
      delete deviceValue.order;
      const payload = {
        "dtype": this.vminfo.dtype,
        "attributes":deviceValue,
        "order": deviceOrder
      };
  
      this.loader.open();
      this.ws.call(this.updateCall, [ params.pk, payload ]).subscribe(() => {
          this.loader.close();
          this.router.navigate(new Array('/').concat(this.route_success));
        },
        (e_res) => {
          this.error_reason = e_res.reason;
          this.loader.close();
          new EntityUtils().handleError(this, e_res);
        }
      );
    });
  }
}
