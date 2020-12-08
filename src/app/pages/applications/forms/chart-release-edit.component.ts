import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../common/entity/entity-form/models/fieldset.interface';
import { ModalService } from '../../../services/modal.service';
import { DialogService } from '../../../services/index';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import  helptext  from '../../../helptext/apps/apps';

@Component({
  selector: 'app-chart-release-edit',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class ChartReleaseEditComponent {
  protected queryCall: string = 'chart.release.query';
  protected queryCallOption: Array<any>;
  protected editCall: string = 'chart.release.update';
  protected isEntity: boolean = true;

  private title= helptext.chartForm.editTitle;
  private name: string;
  private getRow = new Subscription;
  private rowName: string;
  private dialogRef: any;
  protected fieldConfig: FieldConfig[];
  public fieldSets: FieldSet[] = [
    {
      name: 'Name',
      width: '100%',
      config: [
        {
          type: 'input',
          name: 'release_name',
          placeholder: helptext.chartForm.release_name.placeholder,
          tooltip: helptext.chartForm.release_name.tooltip,
          disabled: true
        }
      ],
      colspan: 2
    },
    {
      name: helptext.chartForm.image.title,
      label: true,
      width: '50%',
      config: [
        {
          type: 'input',
          name: 'repository',
          placeholder: helptext.chartForm.image.repo.placeholder,
          tooltip: helptext.chartForm.image.repo.tooltip,
          required: true
        },
        {
          type: 'input',
          name: 'tag',
          placeholder: helptext.chartForm.image.tag.placeholder,
          tooltip: helptext.chartForm.image.tag.tooltip,
          value: 'latest'
        },
        {
          type: 'select',
          name: 'pullPolicy',
          placeholder: helptext.chartForm.image.pullPolicy.placeholder,
          tooltip: helptext.chartForm.image.pullPolicy.tooltip,
          options: helptext.chartForm.image.pullPolicy.options,
          value: helptext.chartForm.image.pullPolicy.options[0].value
        }
      ]
    },
    {
      name: helptext.chartForm.update.title,
      label: true,
      width: '50%',
      config: [
        {
          type: 'select',
          name: 'updateStrategy',
          placeholder: helptext.chartForm.update.placeholder,
          tooltip: helptext.chartForm.update.tooltip,
          options: helptext.chartForm.update.options,
          value: helptext.chartForm.update.options[0].value
        },
        {
          type: 'select',
          name: 'restartPolicy',
          placeholder: helptext.chartForm.restart.placeholder,
          tooltip: helptext.chartForm.restart.tooltip,
          options: helptext.chartForm.restart.options,
          value: helptext.chartForm.restart.options[0].value,
        }
      ]
    },
    {
      name: helptext.chartForm.container.title,
      label: true,
      width: '50%',
      config: [
        {
          type: 'chip',
          name: 'containerCommand',
          placeholder: helptext.chartForm.container.command.placeholder,
          tooltip: helptext.chartForm.container.command.tooltip,
        },
        {
          type: 'chip',
          name: 'containerArgs',
          placeholder: helptext.chartForm.container.args.placeholder,
          tooltip: helptext.chartForm.container.args.tooltip
        }
      ]
    },
    {
      name: helptext.chartForm.container.env_vars.title,
      label: true,
      config: [
        {
          type: 'list',
          name: 'containerEnvironmentVariables',
          width: '100%',
          box: true,
          templateListField: [
            {
              type: 'input',
              name: 'name',
              placeholder: helptext.chartForm.container.env_vars.key.placeholder,
              tooltip: helptext.chartForm.container.env_vars.key.tooltip,
              required: true
            }, 
            {
              type: 'input',
              name: 'value',
              placeholder: helptext.chartForm.container.env_vars.value.placeholder,
              tooltip: helptext.chartForm.container.env_vars.value.tooltip,
              required: true
            }
          ],
          listFields: []
        }
      ],
      colspan: 2,
    },
    {
      name: helptext.chartForm.networking,
      label: true,
      width: '50%',
      config: [
        {
          type: 'checkbox',
          name: 'hostNetwork',
          placeholder: helptext.chartForm.hostNetwork.placeholder,
          tooltip: helptext.chartForm.hostNetwork.tooltip,
          value: false
        }
      ]
    },
    {
      name: helptext.chartForm.externalLabel,
      label: true,
      config: [
        {
          type: 'list',
          name: 'externalInterfaces',
          width: '100%',
          box: true,
          templateListField: [
            {
              type: 'select',
              name: 'hostInterface',
              placeholder: helptext.chartForm.externalInterfaces.host.placeholder,
              tooltip: helptext.chartForm.externalInterfaces.host.tooltip,
              options: helptext.chartForm.externalInterfaces.host.options,
              value: helptext.chartForm.externalInterfaces.host.options[0].value,
            },
            {
              type: 'select',
              name: 'ipam',
              placeholder: helptext.chartForm.externalInterfaces.ipam.placeholder,
              tooltip: helptext.chartForm.externalInterfaces.ipam.tooltip,
              options: helptext.chartForm.externalInterfaces.ipam.options,
              value: helptext.chartForm.externalInterfaces.ipam.options[0].value,
            },
            {
              type: 'list',
              name: 'staticIPConfigurations',
              width: '100%',
              // isHidden: true,
              templateListField: [
                {
                  type: 'ipwithnetmask',
                  name: 'staticIP',
                  placeholder: helptext.chartForm.externalInterfaces.staticConfig.placeholder,
                  // isHidden: true,
                  relation: [
                    {
                      action: 'ENABLE',
                      when: [{
                        name: 'ipam',
                        value: 'static',
                      }]
                    },
                  ],
                }, 
              ],
              listFields: []
            },
            {
              type: 'list',
              name: 'staticRoutes',
              width: '100%',
              // isHidden: true,
              templateListField: [
                {
                  type: 'ipwithnetmask',
                  name: 'destination',
                  placeholder: helptext.chartForm.externalInterfaces.staticRoutes.destination.placeholder,
                }, 
                {
                  type: 'input',
                  name: 'gateway',
                  placeholder: helptext.chartForm.externalInterfaces.staticRoutes.gateway.placeholder,
                }
              ],
              listFields: []
            }
            
          ],
          listFields: []
        }
      ],
      colspan: 2,
    },
    {
      name: helptext.chartForm.DNSPolicy.title,
      label: true,
      width: '50%',
      config: [
        {
          type: 'select',
          name: 'dnsPolicy',
          placeholder: helptext.chartForm.DNSPolicy.placeholder,
          tooltip: helptext.chartForm.DNSPolicy.tooltip,
          options: helptext.chartForm.DNSPolicy.options,
          value: helptext.chartForm.DNSPolicy.options[0].value,
        },
        {
          type: 'paragraph',
          name: 'paragraph_dns_config',
          paraText: helptext.chartForm.DNSConfig.label
        },
        {
          type: 'chip',
          name: 'nameservers',
          placeholder: helptext.chartForm.DNSConfig.nameservers.placeholder,
          tooltip: helptext.chartForm.DNSConfig.nameservers.tooltip,
        },
        {
          type: 'chip',
          name: 'searches',
          placeholder: helptext.chartForm.DNSConfig.searches.placeholder,
          tooltip: helptext.chartForm.DNSConfig.searches.tooltip,
        }
      ]
    },
    {
      name: helptext.chartForm.portForwardingList.title,
      label: true,
      config: [
        {
          type: 'list',
          name: 'portForwardingList',
          width: '100%',
          box: true,
          templateListField: [
            {
              type: 'input',
              name: 'containerPort',
              placeholder: helptext.chartForm.portForwardingList.containerPort.placeholder,
              validation: helptext.chartForm.portForwardingList.containerPort.validation,
              required: true
            }, 
            {
              type: 'input',
              name: 'nodePort',
              placeholder: helptext.chartForm.portForwardingList.nodePort.placeholder,
              validation: helptext.chartForm.portForwardingList.nodePort.validation,
              required: true
            },  
            {
              type: 'select',
              name: 'protocol',
              placeholder: helptext.chartForm.portForwardingList.protocol.placeholder,
              options: helptext.chartForm.portForwardingList.protocol.options,
              value: helptext.chartForm.portForwardingList.protocol.options[0].value
            }
          ],
          listFields: []
        }
      ],
      colspan: 2,
    },
    {
      name: helptext.chartForm.hostPathVolumes.title,
      label: true,
      config: [
        {
          type: 'list',
          name: 'hostPathVolumes',
          width: '100%',
          box: true,
          templateListField: [
            {
              type: 'explorer',
              name: 'hostPath',
              initial: '/mnt',
              explorerType: 'directory',
              placeholder: helptext.chartForm.hostPathVolumes.hostPath.placeholder,
              tooltip: helptext.chartForm.hostPathVolumes.hostPath.tooltip,
              required: true
            }, 
            {
              type: 'input',
              name: 'mountPath',
              placeholder: helptext.chartForm.hostPathVolumes.mountPath.placeholder,
              tooltip: helptext.chartForm.hostPathVolumes.mountPath.tooltip,
              required: true
            },
            {
              type: 'checkbox',
              name: 'readOnly',
              placeholder: helptext.chartForm.hostPathVolumes.readOnly.placeholder,
            }
          ],
          listFields: []
        }
      ],
      colspan: 2,
    },
    {
      name: helptext.chartForm.volumes.title,
      label: true,
      class: 'volume_fields',
      config: [
        {
          type: 'list',
          name: 'volumes',
          width: '100%',
          box: true,
          templateListField: [
            {
              name: 'datasetName',
              placeholder: helptext.chartForm.volumes.datasetName.placeholder,
              tooltip: helptext.chartForm.volumes.datasetName.tooltip,
              type: 'input',
            },
            {
              name: 'mountPath',
              placeholder: helptext.chartForm.volumes.mountPath.placeholder,
              tooltip: helptext.chartForm.volumes.mountPath.tooltip,
              type: 'input',
            }
          ],
          listFields: []
        }
      ],
      colspan: 2,
    },
    {
      name: helptext.chartForm.gpu.title,
      label: true,
      width: '50%',
      config: [
        {
          type: 'input',
          name: 'gpu_property',
          placeholder: helptext.chartForm.gpu.property.placeholder,
          tooltip: helptext.chartForm.gpu.property.tooltip,
        },
        {
          type: 'input',
          name: 'gpu_value',
          placeholder: helptext.chartForm.gpu.value.placeholder,
        }
      ]
    }
  ]

  constructor(private mdDialog: MatDialog, private dialogService: DialogService,
    private modalService: ModalService) {
      this.getRow = this.modalService.getRow$.subscribe((rowName: string) => {
        this.rowName = rowName;
        this.queryCallOption = [["id", "=", rowName]];
        this.getRow.unsubscribe();
    })
     }

  resourceTransformIncomingRestData(data) {
    this.name = data.name;
    data.config.release_name = data.name;
    data.config.repository = data.config.image.repository;
    data.config.tag = data.config.image.tag;
    data.config.pullPolicy = data.config.image.pullPolicy;
    data.config.nameservers = data.config.dnsConfig.nameservers;
    data.config.searches = data.config.dnsConfig.searches;
    data.config.externalInterfaces.forEach(i => {
      i.ipam = i.ipam.type;
    })
    return data.config;
  }

  afterInit(entityEdit: any) {
    // Not working: This sets the isHidden property as expected, but doesn't update the display in the lists within a list
    let extIntfg = _.find(this.fieldConfig, {'name': 'externalInterfaces'});
    let staticRoutesfg = _.find(extIntfg.templateListField, {'name': 'staticRoutes'});
    let staticIPfg = _.find(extIntfg.templateListField, {'name': 'staticIPConfigurations'});
    entityEdit.formGroup.controls['externalInterfaces'].valueChanges.subscribe(value => {
      if (value[0].ipam === 'static') {
        staticIPfg.isHidden = false;
        staticRoutesfg.isHidden = false;
      } else {
        staticIPfg.isHidden = true;
        staticRoutesfg.isHidden = true;
      }
    })
  }

  customSubmit(data) {
    let ext_interfaces = [];
    if (data.externalInterfaces && data.externalInterfaces.length > 0) {
      data.externalInterfaces.forEach(i => {
        if (i.ipam !== 'static') {
          ext_interfaces.push(
            {
              hostInterface: i.hostInterface,
              ipam: {
                type: i.ipam,
              }
            }
          );            
        } else {
          let ipList = [];
          if (i.staticIPConfigurations && i.staticIPConfigurations.length > 0) {
            i.staticIPConfigurations.forEach(item => {
              ipList.push(item.staticIP);
            })
          }
          ext_interfaces.push(
            {
              hostInterface: i.hostInterface,
              ipam: {
                type: i.ipam,
                staticIPConfigurations: ipList,
                staticRoutes: i.staticRoutes
              }
            }
          );
        }
      })
    }
    let GPUObj = {};
    GPUObj[data.gpu_property] = data.gpu_value;

    let payload = [this.name, {
      values: {
        containerArgs: data.containerArgs,
        containerCommand: data.containerCommand,
        containerEnvironmentVariables: data.containerEnvironmentVariables,
        dnsConfig: {
          nameservers: data.nameservers,
          searches: data.searches
        },
        dnsPolicy: data.dnsPolicy,
        externalInterfaces: ext_interfaces,
        gpuConfiguration: GPUObj,
        hostPathVolumes: data.hostPathVolumes,
        hostNetwork: data.hostNetwork,
        image: { 
          repository: data.repository,
          pullPolicy: data.pullPolicy,
          tag: data.tag
        }, 
        portForwardingList: data.portForwardingList, 
        restartPolicy: data.restartPolicy,
        updateStrategy: data.updateStrategy,
        volumes: data.volumes, 
        workloadType: 'Deployment',
      }
    }]
 
    this.dialogRef = this.mdDialog.open(EntityJobComponent, { data: { 'title': (
      helptext.installing) }, disableClose: true});
    this.dialogRef.componentInstance.setCall(this.editCall, payload);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe(() => {
      this.dialogService.closeAllDialogs();
      this.modalService.close('slide-in-form');
      this.modalService.refreshTable();
    });
    this.dialogRef.componentInstance.failure.subscribe((err) => {
      // new EntityUtils().handleWSError(this, err, this.dialogService);
    })
  }

}
