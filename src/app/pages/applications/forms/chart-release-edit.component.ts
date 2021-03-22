import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import {FormBuilder, FormControl, FormGroup, FormArray, Validators} from '@angular/forms';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../common/entity/entity-form/models/fieldset.interface';
import { ModalService } from '../../../services/modal.service';
import { DialogService } from '../../../services/index';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import { ApplicationsService } from '../applications.service';
import  helptext  from '../../../helptext/apps/apps';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FormListComponent } from '../../common/entity/entity-form/components/form-list/form-list.component';
import { EntityUtils } from '../../common/entity/utils';

@Component({
  selector: 'app-chart-release-edit',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class ChartReleaseEditComponent {
  protected queryCall: string = 'chart.release.query';
  protected queryCallOption: Array<any>;
  protected customFilter: any[];
  protected editCall: string = 'chart.release.update';
  protected isEntity: boolean = true;
  protected entityForm: EntityFormComponent;
  private entityUtils = new EntityUtils();

  private title= helptext.chartForm.editTitle;
  private name: string;
  private getRow = new Subscription;
  private rowName: string;
  private interfaceList = [];
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
            }, 
            {
              type: 'input',
              name: 'value',
              placeholder: helptext.chartForm.container.env_vars.value.placeholder,
              tooltip: helptext.chartForm.container.env_vars.value.tooltip,
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
          customEventMethod: this.onChangeExternalInterfaces,
          templateListField: [
            {
              type: 'select',
              name: 'hostInterface',
              placeholder: helptext.chartForm.externalInterfaces.host.placeholder,
              tooltip: helptext.chartForm.externalInterfaces.host.tooltip,
              options: this.interfaceList
            },
            {
              type: 'select',
              name: 'ipam',
              placeholder: helptext.chartForm.externalInterfaces.ipam.placeholder,
              tooltip: helptext.chartForm.externalInterfaces.ipam.tooltip,
              options: helptext.chartForm.externalInterfaces.ipam.options,
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
            }, 
            {
              type: 'input',
              name: 'nodePort',
              placeholder: helptext.chartForm.portForwardingList.nodePort.placeholder,
              validation: helptext.chartForm.portForwardingList.nodePort.validation,
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
              hideDirs: 'ix-applications',
              placeholder: helptext.chartForm.hostPathVolumes.hostPath.placeholder,
              tooltip: helptext.chartForm.hostPathVolumes.hostPath.tooltip,
            }, 
            {
              type: 'input',
              name: 'mountPath',
              placeholder: helptext.chartForm.hostPathVolumes.mountPath.placeholder,
              tooltip: helptext.chartForm.hostPathVolumes.mountPath.tooltip,
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
    }
  ]

  constructor(private mdDialog: MatDialog, private dialogService: DialogService,
    private modalService: ModalService, private appService: ApplicationsService) {
      this.appService.getNICChoices().subscribe(res => {
        for (let item in res) {
          this.interfaceList.push({ label: item, value: item})
        }
      })
      this.getRow = this.modalService.getRow$.subscribe((rowName: string) => {
        this.rowName = rowName;
        this.customFilter = [[["id", "=", rowName]], {extra: {include_chart_schema: true}}];
        this.getRow.unsubscribe();
      })
     }

  parseSchema(schema) {
    let hasGpuConfig = false;
    try {

      const gpuConfiguration = schema.questions.find(question => question.variable=='gpuConfiguration');

      if (gpuConfiguration && gpuConfiguration.schema.attrs.length > 0) {
        const fieldConfigs = this.entityUtils.parseSchemaFieldConfig(gpuConfiguration);
        const gpuFieldSet = {
          name: gpuConfiguration.group,
          label: true,
          config: fieldConfigs
        };

        this.fieldSets.push(gpuFieldSet);

        hasGpuConfig = true;
      }
      
    } catch(error) {
      return this.dialogService.errorReport(helptext.chartForm.parseError.title, helptext.chartForm.parseError.message);
    }

    return hasGpuConfig;
  }
  
  resourceTransformIncomingRestData(data) {
    this.name = data.name;
    data.config.release_name = data.name;
    data.config.repository = data.config.image.repository;
    data.config.tag = data.config.image.tag;
    data.config.pullPolicy = data.config.image.pullPolicy;
    data.config.nameservers = data.config.dnsConfig.nameservers;
    data.config.searches = data.config.dnsConfig.searches;
    if (data.config.externalInterfaces) {
      data.config.externalInterfaces.forEach(i => {
        let tempArr = [];
        if (i.ipam.staticIPConfigurations && i.ipam.staticIPConfigurations.length > 0) {
          i.ipam.staticIPConfigurations.forEach(j => {
            tempArr.push({staticIP: j})
          })
          i.staticIPConfigurations = tempArr;
          i.staticRoutes = i.ipam.staticRoutes;
        }

        i.ipam = i.ipam.type;
      })
    }

    if (data.gpuConfiguration) {
      this.entityUtils.parseConfigData(data.gpuConfiguration, 'gpuConfiguration', data.config);
    }

    const hasGpuConfig = this.parseSchema(data.chart_schema.schema);
    data.config['changed_schema'] = hasGpuConfig;

    return data.config;
  }

  onChangeExternalInterfaces(listComponent: FormListComponent) {
    
    listComponent.listsFromArray.controls.forEach((externalInterface, index) => {
      const staticRoutesFC = _.find(listComponent.config.listFields[index], {'name': 'staticRoutes'});
      const staticIPConfigurationsFC = _.find(listComponent.config.listFields[index], {'name': 'staticIPConfigurations'});
  
      (<FormGroup>externalInterface).controls['ipam'].valueChanges.subscribe(value => {
        if (value === 'static') {
          staticIPConfigurationsFC.isHidden = false;
          staticRoutesFC.isHidden = false;
        } else {
          staticIPConfigurationsFC.isHidden = true;
          staticRoutesFC.isHidden = true;
        }
      })
    });
  }

  customSubmit(data) {

    let parsedData = {};
    this.entityUtils.parseFormControlValues(data, parsedData);
    
    let envVars = [];
    if (data.containerEnvironmentVariables && data.containerEnvironmentVariables.length > 0 && data.containerEnvironmentVariables[0].name) {
      envVars = data.containerEnvironmentVariables;
    }
    
    let pfList = [];
    if (data.portForwardingList && data.portForwardingList.length > 0 && data.portForwardingList[0].containerPort) {
      pfList = data.portForwardingList;
    }

    let hpVolumes = [];
    if (data.hostPathVolumes && data.hostPathVolumes.length > 0 && data.hostPathVolumes[0].hostPath) {
      hpVolumes = data.hostPathVolumes;
    }

    let volList = [];
    if (data.volumes && data.volumes.length > 0 && data.volumes[0].datasetName) {
      volList = data.volumes;
    }

    let ext_interfaces = [];
    if (data.externalInterfaces && data.externalInterfaces.length > 0 && data.externalInterfaces[0].hostInterface) {
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

    let payload = [this.name, {
      values: {
        containerArgs: data.containerArgs,
        containerCommand: data.containerCommand,
        containerEnvironmentVariables: envVars,
        dnsConfig: {
          nameservers: data.nameservers,
          searches: data.searches
        },
        dnsPolicy: data.dnsPolicy,
        externalInterfaces: ext_interfaces,
        hostPathVolumes: hpVolumes,
        hostNetwork: data.hostNetwork,
        image: { 
          repository: data.repository,
          pullPolicy: data.pullPolicy,
          tag: data.tag
        }, 
        portForwardingList: pfList, 
        updateStrategy: data.updateStrategy,
        volumes: volList, 
        workloadType: 'Deployment',
      }
    }]
 
    if (parsedData['gpuConfiguration']) {
      payload[1]['values']['gpuConfiguration'] = parsedData['gpuConfiguration'];
    }

    this.dialogRef = this.mdDialog.open(EntityJobComponent, { data: { 'title': (
      helptext.installing) }, disableClose: true});
    this.dialogRef.componentInstance.setCall(this.editCall, payload);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe(() => {
      this.dialogService.closeAllDialogs();
      this.modalService.close('slide-in-form');
      this.modalService.refreshTable();
    });
  }

}
