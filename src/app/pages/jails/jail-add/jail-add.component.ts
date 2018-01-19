import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { JailService } from '../../../services/';

import { WebSocketService } from '../../../services/';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';

import { EntityFormComponent } from '../../common/entity/entity-form';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { EntityFormService } from '../../common/entity/entity-form/services/entity-form.service';
import { EntityUtils } from '../../common/entity/utils';

@Component({
  selector: 'jail-add',
  templateUrl: './jail-add.component.html',
  providers: [JailService, EntityFormService]
})
export class JailAddComponent implements OnInit {

  protected addCall = 'jail.create';
  public route_success: string[] = ['jails'];
  protected route_conf: string[] = ['jails', 'configuration'];

  public formGroup: any;
  public error: string;
  public busy: Subscription;

  protected formFileds: FieldConfig[];
  public basicfieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'uuid',
      placeholder: 'Jails Name',
      tooltip : 'Mandatory. Can only contain letters, numbers, dashes,\
 or the underscore character.',
    },
    {
      type: 'select',
      name: 'release',
      placeholder: 'Release',
      tooltip : 'Select the release for the jail.',
      options: [],
    },
    {
      type: 'input',
      name: 'ip4_addr',
      placeholder: 'IPv4 Address',
      tooltip : 'This and the other IPv4 settings are grayed out if\
 <b>IPv4 DHCP</b> is checked. Enter a unique IP address that is in the\
 local network and not already used by any other computer.',
    },
    {
      type: 'input',
      name: 'defaultrouter',
      placeholder: 'Default Router',
    },
    {
      type: 'input',
      name: 'ip6_addr',
      placeholder: 'IPv6 Address',
      tooltip : 'This and other IPv6 settings are grayed out if\
 <b>IPv6 Autoconfigure</b> is checked; enter a unique IPv6 address that\
 is in the local network and not already used by any other computer',
    },
    {
      type: 'input',
      name: 'defaultrouter6',
      placeholder: 'Default Router For IPv6',
    },
    {
      type: 'input',
      name: 'notes',
      placeholder: 'Note',
    },
    {
      type: 'checkbox',
      name: 'vnet',
      placeholder: 'Vnet',
    }
  ];
  public jailfieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'devfs_ruleset',
      placeholder: 'devfs_ruleset',
    },
    {
      type: 'input',
      name: 'exec_start',
      placeholder: 'exec_start',
    },
    {
      type: 'input',
      name: 'exec_stop',
      placeholder: 'exec_stop',
    },
    {
      type: 'input',
      name: 'exec_prestart',
      placeholder: 'exec_prestart',
    },
    {
      type: 'input',
      name: 'exec_poststart',
      placeholder: 'exec_poststart',
    }, {
      type: 'input',
      name: 'exec_prestop',
      placeholder: 'exec_prestop',
    }, {
      type: 'input',
      name: 'exec_poststop',
      placeholder: 'exec_poststop',
    }, {
      type: 'checkbox',
      name: 'exec_clean',
      placeholder: 'exec_clean',
    }, {
      type: 'input',
      name: 'exec_timeout',
      placeholder: 'exec_timeout',
    }, {
      type: 'input',
      name: 'stop_timeout',
      placeholder: 'stop_timeout',
    }, {
      type: 'input',
      name: 'exec_jail_user',
      placeholder: 'exec_jail_user',
    }, {
      type: 'input',
      name: 'exec_system_jail_user',
      placeholder: 'exec_system_jail_user',
    }, {
      type: 'input',
      name: 'exec_system_user',
      placeholder: 'exec_system_user',
    }, {
      type: 'checkbox',
      name: 'mount_devfs',
      placeholder: 'mount_devfs',
    }, {
      type: 'checkbox',
      name: 'mount_fdescfs',
      placeholder: 'mount_fdescfs',
    }, {
      //"enforce_statfs": ("0", "1", "2"),
      type: 'select',
      name: 'enforce_statfs',
      placeholder: 'enforce_statfs',
      options: [{
        label: 'O',
        value: '0',
      }, {
        label: '1',
        value: '1',
      }, {
        label: '2',
        value: '2',
      }]
    }, {
      type: 'input',
      name: 'children_max',
      placeholder: 'children_max',
    }, {
      type: 'input',
      name: 'login_flags',
      placeholder: 'login_flags',
    }, {
      type: 'input',
      name: 'securelevel',
      placeholder: 'securelevel',
    }, {
      type: 'select',
      name: 'sysvmsg',
      placeholder: 'sysvmsg',
      options: [{
        label: 'New',
        value: 'new',
      }, {
        label: 'Inherit',
        value: 'inherit',
      }, {
        label: 'disable',
        value: 'disable',
      }]
    }, {
      type: 'select',
      name: 'sysvsem',
      placeholder: 'sysvsem',
      options: [{
        label: 'New',
        value: 'new',
      }, {
        label: 'Inherit',
        value: 'inherit',
      }, {
        label: 'disable',
        value: 'disable',
      }]
    }, {
      type: 'select',
      name: 'sysvshm',
      placeholder: 'sysvshm',
      options: [{
        label: 'New',
        value: 'new',
      }, {
        label: 'Inherit',
        value: 'inherit',
      }, {
        label: 'disable',
        value: 'disable',
      }]
    }, {
      type: 'checkbox',
      name: 'allow_set_hostname',
      placeholder: 'allow_set_hostname',
    }, {
      type: 'checkbox',
      name: 'allow_sysvipc',
      placeholder: 'allow_sysvipc',
    }, {
      type: 'checkbox',
      name: 'allow_raw_sockets',
      placeholder: 'allow_raw_sockets',
    }, {
      type: 'checkbox',
      name: 'allow_chflags',
      placeholder: 'allow_chflags',
    }, {
      type: 'checkbox',
      name: 'allow_mount',
      placeholder: 'allow_mount',
    }, {
      type: 'checkbox',
      name: 'allow_mount_devfs',
      placeholder: 'allow_mount_devfs',
    }, {
      type: 'checkbox',
      name: 'allow_mount_nullfs',
      placeholder: 'allow_mount_nullfs',
    }, {
      type: 'checkbox',
      name: 'allow_mount_procfs',
      placeholder: 'allow_mount_procfs',
    }, {
      type: 'checkbox',
      name: 'allow_mount_tmpfs',
      placeholder: 'allow_mount_tmpfs',
    }, {
      type: 'checkbox',
      name: 'allow_mount_zfs',
      placeholder: 'allow_mount_zfs',
    }, {
      type: 'checkbox',
      name: 'allow_quotas',
      placeholder: 'allow_quotas',
    }, {
      type: 'checkbox',
      name: 'allow_socket_af',
      placeholder: 'allow_socket_af',
    }
  ];
  public networkfieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'interfaces',
      placeholder: 'interfaces',
    },
    {
      type: 'input',
      name: 'host_domainname',
      placeholder: 'host_domainname',
    },
    {
      type: 'input',
      name: 'host_hostname',
      placeholder: 'host_hostname',
    },
    {
      type: 'input',
      name: 'exec_fib',
      placeholder: 'exec_fib',
    },
    {
      type: 'checkbox',
      name: 'ip4_saddrsel',
      placeholder: 'ip4_saddrsel',
    },
    {
      type: 'select',
      name: 'ip4',
      placeholder: 'ip4',
      options: [{
        label: 'New',
        value: 'new',
      }, {
        label: 'Inherit',
        value: 'inherit',
      }, {
        label: 'None',
        value: 'none',
      }]
    },
    {
      type: 'checkbox',
      name: 'ip6_saddrsel',
      placeholder: 'ip6_saddrsel',
    },
    {
      type: 'select',
      name: 'ip6',
      placeholder: 'ip6',
      options: [{
        label: 'New',
        value: 'new',
      }, {
        label: 'Inherit',
        value: 'inherit',
      }, {
        label: 'None',
        value: 'none',
      }]
    },
    {
      type: 'input',
      name: 'resolver',
      placeholder: 'resolver',
    },
    {
      type: 'input',
      name: 'mac_prefix',
      placeholder: 'mac_prefix',
    },
    {
      type: 'input',
      name: 'vnet0_mac',
      placeholder: 'vnet0_mac',
    },
    {
      type: 'input',
      name: 'vnet1_mac',
      placeholder: 'vnet1_mac',
    },
    {
      type: 'input',
      name: 'vnet2_mac',
      placeholder: 'vnet2_mac',
    },
    {
      type: 'input',
      name: 'vnet3_mac',
      placeholder: 'vnet3_mac',
    },
  ];
  public customConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'owner',
      placeholder: 'owner',
    },
    {
      type: 'input',
      name: 'priority',
      placeholder: 'priority',
    },
    {
      type: 'input',
      name: 'hostid',
      placeholder: 'hostid',
    },
    {
      type: 'input',
      name: 'comment',
      placeholder: 'comment',
    },
    {
      type: 'input',
      name: 'depends',
      placeholder: 'depends',
    },
    {
      type: 'checkbox',
      name: 'bpf',
      placeholder: 'bpf',
    },
    {
      type: 'checkbox',
      name: 'dhcp',
      placeholder: 'dhcp',
    },
    {
      type: 'checkbox',
      name: 'boot',
      placeholder: 'boot',
    },
    {
      type: 'checkbox',
      name: 'mount_procfs',
      placeholder: 'mount_procfs',
    },
    {
      type: 'checkbox',
      name: 'mount_linprocfs',
      placeholder: 'mount_linprocfs',
    },
    {
      type: 'checkbox',
      name: 'template',
      placeholder: 'template',
    },
    {
      type: 'checkbox',
      name: 'host_time',
      placeholder: 'host_time',
    },
    {
      type: 'checkbox',
      name: 'jail_zfs',
      placeholder: 'jail_zfs',
    },
    {
      type: 'input',
      name: 'jail_zfs_dataset',
      placeholder: 'jail_zfs_dataset',
    },
    {
      type: 'input',
      name: 'jail_zfs_mountpoint',
      placeholder: 'jail_zfs_mountpoint',
    },
  ];
  public rctlConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'memoryuse',
      placeholder: 'memoryuse',
    },
    {
      type: 'input',
      name: 'pcpu',
      placeholder: 'pcpu',
    },
    {
      type: 'checkbox',
      name: 'cpuset',
      placeholder: 'cpuset',
    },
    {
      type: 'checkbox',
      name: 'rlimits',
      placeholder: 'rlimits',
    },
    {
      type: 'checkbox',
      name: 'memorylocked',
      placeholder: 'memorylocked',
    },
    {
      type: 'checkbox',
      name: 'vmemoryuse',
      placeholder: 'vmemoryuse',
    },
    {
      type: 'checkbox',
      name: 'maxproc',
      placeholder: 'maxproc',
    },
    {
      type: 'checkbox',
      name: 'cputime',
      placeholder: 'cputime',
    },
    {
      type: 'checkbox',
      name: 'datasize',
      placeholder: 'datasize',
    },
    {
      type: 'checkbox',
      name: 'stacksize',
      placeholder: 'stacksize',
    },
    {
      type: 'checkbox',
      name: 'coredumpsize',
      placeholder: 'coredumpsize',
    },
    {
      type: 'checkbox',
      name: 'openfiles',
      placeholder: 'openfiles',
    },
    {
      type: 'checkbox',
      name: 'pseudoterminals',
      placeholder: 'pseudoterminals',
    },
    {
      type: 'checkbox',
      name: 'swapuse',
      placeholder: 'swapuse',
    },
    {
      type: 'checkbox',
      name: 'nthr',
      placeholder: 'nthr',
    },
    {
      type: 'checkbox',
      name: 'msgqqueued',
      placeholder: 'msgqqueued',
    },
    {
      type: 'checkbox',
      name: 'msgqsize',
      placeholder: 'msgqsize',
    },
    {
      type: 'checkbox',
      name: 'nmsgq',
      placeholder: 'nmsgq',
    },
    {
      type: 'checkbox',
      name: 'nsemop',
      placeholder: 'nsemop',
    },
    {
      type: 'checkbox',
      name: 'nshm',
      placeholder: 'nshm',
    },
    {
      type: 'checkbox',
      name: 'shmsize',
      placeholder: 'shmsize',
    },
    {
      type: 'checkbox',
      name: 'wallclock',
      placeholder: 'wallclock',
    },
  ];

  protected releaseField: any;
  public step: any = 0;

  // fields only accpeted by ws with value 0/1
  protected TFfields: any = [
    'ip4_saddrsel',
    'ip6_saddrsel',
    'exec_clean',
    'mount_devfs',
    'mount_fdescfs',
    'allow_set_hostname',
    'allow_sysvipc',
    'allow_raw_sockets',
    'allow_chflags',
    'allow_mount',
    'allow_mount_devfs',
    'allow_mount_nullfs',
    'allow_mount_procfs',
    'allow_mount_tmpfs',
    'allow_mount_zfs',
    'allow_quotas',
    'allow_socket_af',
    'mount_procfs',
    'mount_linprocfs'
  ];
  // fields only accpeted by ws with value on/off
  protected OFfields: any = [
    'cpuset',
    'rlimits',
    'memorylocked',
    'vmemoryuse',
    'maxproc',
    'cputime',
    'datasize',
    'stacksize',
    'coredumpsize',
    'openfiles',
    'pseudoterminals',
    'swapuse',
    'nthr',
    'msgqqueued',
    'msgqsize',
    'nmsgq',
    'nsemop',
    'nshm',
    'shmsize',
    'wallclock',
    'dhcp',
    'boot',
    'jail_zfs',
    'vnet',
  ];
  // fields only accpeted by ws with value yes/no
  protected YNfields: any = [
    'bpf',
    'template',
    'host_time',
  ];

  protected currentServerVersion: any;
  constructor(protected router: Router,
    protected jailService: JailService,
    protected ws: WebSocketService,
    protected entityFormService: EntityFormService,
    protected loader: AppLoaderService) {}

  ngOnInit() {
    this.releaseField = _.find(this.basicfieldConfig, { 'name': 'release' });
    this.ws.call('system.info').subscribe((res) => {
      this.currentServerVersion = Number(_.split(res.version, '-')[1]);
      this.jailService.getLocalReleaseChoices().subscribe((res_local) => {
        for (let j in res_local) {
          let rlVersion = Number(_.split(res_local[j], '-')[0]);
          if (this.currentServerVersion >= Math.floor(rlVersion)) {
            this.releaseField.options.push({ label: res_local[j] + '(fetched)', value: res_local[j] });
          }
        }
        this.jailService.getRemoteReleaseChoices().subscribe((res_remote) => {
          for (let i in res_remote) {
            if (_.indexOf(res_local, res_remote[i]) < 0) {
              let rmVersion = Number(_.split(res_remote[i], '-')[0]);
              if (this.currentServerVersion >= Math.floor(rmVersion)) {
                this.releaseField.options.push({ label: res_remote[i], value: res_remote[i] });
              }
            }
          }
        });
      });
    },
    (res) => {
      new EntityUtils().handleError(this, res);
    });

    this.formFileds = _.concat(this.basicfieldConfig, this.jailfieldConfig, this.networkfieldConfig, this.customConfig, this.rctlConfig);
    this.formGroup = this.entityFormService.createFormGroup(this.formFileds);
  }

  goBack() {
    this.router.navigate(new Array('').concat(this.route_success));
  }

  onSubmit(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.error = null;
    let property: any = [];
    let value = _.cloneDeep(this.formGroup.value);

    for (let i in value) {
      if (value.hasOwnProperty(i)) {
        if (value[i] == undefined) {
          delete value[i];
        } else {
          if (_.indexOf(this.TFfields, i) > 0) {
            if (value[i]) {
              property.push(i + '=1');
            } else {
              property.push(i + '=0');
            }
            delete value[i];
          } else if (_.indexOf(this.OFfields, i) > 0) {
            if (value[i]) {
                property.push(i + '=on');
              } else {
                property.push(i + '=off');
              }
              delete value[i];
          } else if (_.indexOf(this.YNfields, i) > 0) {
            if (value[i]) {
                property.push(i + '=yes');
              } else {
                property.push(i + '=no');
              }
              delete value[i];
          } else {
            if (i != 'uuid' && i != 'release') {
              property.push(i + '=' + value[i]);
              delete value[i];
            }
          }
        }
      }
    }
    value['props'] = property;

    this.loader.open();
    this.ws.job(this.addCall, [value]).subscribe(
      (res) => {
        this.loader.close();
        if (res.error) {
          this.error = res.error;
        } else {
          this.router.navigate(new Array('/').concat(this.route_success));
        }
      },
      (res) => {
        new EntityUtils().handleError(this, res);
      }
    );
  }

  setStep(index: number) {
    this.step = index;
  }

  nextStep() {
    this.step++;
  }

  prevStep() {
    this.step--;
  }
}
