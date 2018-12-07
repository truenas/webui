import {Component,OnInit} from '@angular/core';
import {Validators} from '@angular/forms';
import {Router, ActivatedRoute} from '@angular/router';
import {FieldConfig} from '../../../common/entity/entity-form/models/field-config.interface';
import * as _ from 'lodash';
import {EntityFormService} from '../../../../pages/common/entity/entity-form/services/entity-form.service';
import { TranslateService } from '@ngx-translate/core';

import {RestService, WebSocketService, SystemGeneralService, NetworkService} from '../../../../services/';
import {EntityUtils} from '../../../common/entity/utils';
import { regexValidator } from '../../../common/entity/entity-form/validators/regex-validation';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { element } from 'protractor';

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

  public custActions: any[];

  public fieldConfig: FieldConfig[] = [
    {
      type: 'select',
      name: 'dtype',
      placeholder: 'Type',
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
      value: 'CDROM',
      required: true,
      validation: [Validators.required],
      isHidden: true
    }
  ];

  // cd-rom
  public cdromFieldConfig: FieldConfig[] = [
    {
      type : 'explorer',
      initial: '/mnt',
      name : 'path',
      placeholder : 'CD-ROM Path',
      tooltip : 'Browse to a CD-ROM file present on the system storage.',
      validation : [ Validators.required ],
      required: true
    },
    {
      name : 'order',
      placeholder : 'Device Order',
      tooltip : '',
      type: 'input',
      value: null,
      inputType: 'number'
    },
  ];
  //disk 
  public diskFieldConfig: FieldConfig[] = [
    {
      name : 'path',
      placeholder : 'Zvol',
      tooltip : 'Browse to an existing <a\
                 href="%%docurl%%/storage.html%%webversion%%#adding-zvols"\
                 target="_blank">Zvol</a>.',
      type: 'select',
      required: true,
      validation : [Validators.required],
      options:[]
    },
    {
      name : 'type',
      placeholder : 'Mode',
      tooltip : '<i>AHCI</i> emulates an AHCI hard disk for better\
                 software compatibility. <i>VirtIO</i> uses\
                 paravirtualized drivers and can provide better\
                 performance, but requires the operating system\
                 installed in the VM to support VirtIO disk devices.',
      type: 'select',
      options : [
        {label : 'AHCI', value : 'AHCI'},
        {label : 'VirtIO', value : 'VIRTIO'},
      ],
    },
    {
      name : 'sectorsize',
      placeholder : 'Disk sector size',
      tooltip : 'Select the sector size in bytes. The default <i>0</i>\
                 leaves the sector size unset.',
      type: 'select',
      options: [
        { label: 'Default', value:0 },
        { label: '512', value:512 },
        { label: '4096', value:4096 },

      ],
      value: 0
    },
    {
      name : 'order',
      placeholder : 'Device Order',
      tooltip : '',
      type: 'input',
      value: null,
      inputType: 'number'
    },
  ];
  //nic
  public nicFieldConfig: FieldConfig[] = [
    {
      name: 'type',
      placeholder: 'Adapter Type:',
      tooltip: 'Emulating an <i>Intel e82545 (e1000)</i> Ethernet card\
                provides compatibility with most operating systems. Change to\
                <i>VirtIO</i> to provide better performance on systems\
                with VirtIO paravirtualized network driver support.',
      type: 'select',
      options: [],
      validation: [Validators.required],
      required: true
    },
    {
      name: 'mac',
      placeholder: 'MAC Address',
      tooltip: 'By default, the VM receives an auto-generated random\
                MAC address. Enter a custom address into the field to\
                override the default. Click <b>Generate MAC Address</b>\
                to add a new randomized address into this field.',
      type: 'input',
      value: '00:a0:98:FF:FF:FF',
      validation: [regexValidator(/\b([0-9A-F]{2}[:-]){5}([0-9A-F]){2}\b/i)],
    },
    {
      name: 'nic_attach',
      placeholder: 'Nic to attach:',
      tooltip: 'Select a physical interface to associate with the VM.',
      type: 'select',
      options: [],
      validation: [Validators.required],
      required: true
    },
    {
      name : 'order',
      placeholder : 'Device Order',
      tooltip : '',
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
      placeholder : 'Raw File',
      tooltip : 'Browse to a storage location and add the name of the\
                 new raw file on the end of the path.',
      required: true,
      validation: [Validators.required]
    },
    {
      type : 'select',
      name : 'sectorsize',
      placeholder : 'Disk sector size',
      tooltip : 'Select a sector size in bytes. <i>0</i> leaves the\
                 sector size unset.',
      options: [
        { label: 'Default', value:0 },
        { label: '512', value:512 },
        { label: '4096', value:4096 },
              ],
      value: 0
    },
    {
      name : 'type',
      placeholder : 'Mode',
      tooltip : '<i>AHCI</i> emulates an AHCI hard disk for best\
                 software compatibility. <i>VirtIO</i> uses\
                 paravirtualized drivers and can provide better\
                 performance, but requires the operating system\
                 installed in the VM to support VirtIO disk devices.',
      type: 'select',
      options : [
        {label : 'AHCI', value : 'AHCI'},
        {label : 'VirtIO', value : 'VIRTIO'},
      ],
    },
    {
      name : 'order',
      placeholder : 'Device Order',
      tooltip : '',
      type: 'input',
      value: null,
      inputType: 'number'
    },
    {
      type : 'input',
      name : 'size',
      placeholder : 'Raw filesize',
      tooltip : 'Define the size of the raw file in GiB.',
      inputType : 'number',
    },
    {
      type : 'input',
      name : 'rootpwd',
      placeholder : 'password',
      tooltip : 'Enter a password for the <i>rancher</i> user. This\
                 is used to log in to the VM from the serial shell.',
      inputType : 'password',
      isHidden: true
    },
    {
      type : 'checkbox',
      name : 'boot',
      placeholder : 'boot',
      tooltip : '',
      isHidden: true
    },
  ];

  //vnc
  public vncFieldConfig: FieldConfig[]  = [
    {
      name : 'vnc_port',
      placeholder : 'Port',
      tooltip : 'Can be set to <i>0</i>, left empty for FreeNAS to\
                 assign a port when the VM is started, or set to a\
                 fixed, preferred port number.',
      type : 'input',
      inputType: 'number'
    },
    {
      name : 'wait',
      placeholder : 'Wait to boot',
      tooltip : 'Set for the VNC client to wait until the VM has\
                 booted before attempting the connection.',
      type: 'checkbox'
    },
    {
      name : 'vnc_resolution',
      placeholder : 'Resolution',
      tooltip : 'Select a screen resolution to use for VNC sessions.',
      type: 'select',
      options : [
        {label : '1920x1080', value : "1920x1080"},
        {label : '1400x1050', value : "1400x1050"},
        {label : '1280x1024', value : "1280x1024"},
        {label : '1280x960', value : "1280x960"},
        {label : '1024x768', value : '1024x768'},
        {label : '800x600', value : '800x600'},
        {label : '640x480', value : '640x480'},
      ],
    },
    {
      name : 'vnc_bind',
      placeholder : 'Bind',
      tooltip : 'Select an IP address to use for VNC sessions.',
      type: 'select',
      options : [],
    },
    {
      name : 'vnc_password',
      placeholder : 'Password',
      tooltip : 'Enter a VNC password to automatically pass to the\
                 VNC session. Passwords cannot be longer than 8\
                 characters.',
      type : 'input',
      inputType : 'password',
      validation: [Validators.maxLength(8)]
    },
    {
      name : 'vnc_web',
      placeholder : 'Web Interface',
      tooltip : 'Set to enable connecting to the VNC web interface.',
      type: 'checkbox'
    },
    {
      name : 'order',
      placeholder : 'Device Order',
      tooltip : '',
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
              protected networkService: NetworkService) {}


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
          this.loader.close();
          new EntityUtils().handleError(this, e_res);
        }
      );
    });
  }
}
