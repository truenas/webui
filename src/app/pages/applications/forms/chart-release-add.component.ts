import { Component, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import * as _ from 'lodash';
import { FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

import { Wizard } from '../../common/entity/entity-form/models/wizard.interface';
import { EntityWizardComponent } from '../../common/entity/entity-wizard/entity-wizard.component';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { ModalService } from 'app/services/modal.service';
import { DialogService } from '../../../services/index';
import { ApplicationsService } from '../applications.service';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import  helptext  from '../../../helptext/apps/apps';
import { FormListComponent } from '../../common/entity/entity-form/components/form-list/form-list.component';
import { EntityUtils } from '../../common/entity/utils';

@Component({
  selector: 'app-chart-release-add',
  template: `<entity-wizard [conf]="this"></entity-wizard>`

})
export class ChartReleaseAddComponent implements OnDestroy {
  protected queryCall: string = 'chart.release.query';
  protected queryCallOption: Array<any>;
  protected addCall: string = 'chart.release.create';
  protected isEntity: boolean = true;

  private title = helptext.chartForm.title;
  private dialogRef: any;
  public hideCancel = true;
  public summary = {};
  summary_title = 'Chart Release Summary';
  private entityWizard: any;
  private destroy$ = new Subject();
  // private isLinear = true;
  private interfaceList = [];
  private entityUtils = new EntityUtils();

  protected fieldConfig: FieldConfig[];
  public wizardConfig: Wizard[] = [
    {
      label: helptext.wizardLabels.image,
      fieldConfig: [
        {
          type: 'input',
          name: 'release_name',
          placeholder: helptext.chartForm.release_name.placeholder,
          tooltip: helptext.chartForm.release_name.tooltip,
          required: true
        },
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
        },
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
      label: helptext.wizardLabels.container,
      fieldConfig: [
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
        },
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
    },
    {
      label: helptext.chartForm.networking,
      fieldConfig: [
        {
          type: 'checkbox',
          name: 'hostNetwork',
          placeholder: helptext.chartForm.hostNetwork.placeholder,
          tooltip: helptext.chartForm.hostNetwork.tooltip,
          value: false
        },
        {
          type: 'list',
          name: 'externalInterfaces',
          label: 'Add External Interface',
          box: true,
          width: '100%',
          customEventMethod: this.onChangeExternalInterfaces,
          templateListField: [
            {
              type: 'select',
              name: 'hostInterface',
              placeholder: helptext.chartForm.externalInterfaces.host.placeholder,
              tooltip: helptext.chartForm.externalInterfaces.host.tooltip,
              options: this.interfaceList,
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
              templateListField: [
                {
                  type: 'ipwithnetmask',
                  name: 'staticIP',
                  placeholder: helptext.chartForm.externalInterfaces.staticConfig.placeholder,
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
        },
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
          value: []
        },
        {
          type: 'chip',
          name: 'searches',
          placeholder: helptext.chartForm.DNSConfig.searches.placeholder,
          tooltip: helptext.chartForm.DNSConfig.searches.tooltip,
          value: []
        }
      ]
    },
    {
      label: helptext.chartForm.portForwardingList.title,
      fieldConfig: [
        {
          type: 'list',
          name: 'portForwardingList',
          box: true,
          width: '100%',
          templateListField: [
            {
              type: 'input',
              name: 'containerPort',
              placeholder: helptext.chartForm.portForwardingList.containerPort.placeholder,
              validation: helptext.chartForm.portForwardingList.containerPort.validation
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
    },
    {
      label: helptext.chartForm.hostPathVolumes.title,
      fieldConfig: [
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
              value: false,

            }
          ],
          listFields: []
        }
      ],
    },
    {
      label: helptext.chartForm.volumes.title,
      fieldConfig: [
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
      ]
    }
  ]

  private summaryItems = [
    { step: 0, fieldName:'release_name', label: helptext.chartForm.release_name.placeholder},
    { step: 0, fieldName:'repository', label: helptext.chartForm.image.repo.placeholder},
    { step: 0, fieldName:'tag', label: helptext.chartForm.image.tag.placeholder},
    { step: 1, fieldName:'containerCommand', label: helptext.chartForm.container.command.placeholder}
  ]

  constructor(private mdDialog: MatDialog, private dialogService: DialogService,
    private modalService: ModalService, private appService: ApplicationsService) {
      this.appService.getNICChoices().subscribe(res => {
        for (let item in res) {
          this.interfaceList.push({ label: item, value: item})
        }
      })
     }

  afterInit(entityWizard: EntityWizardComponent) {
    this.entityWizard = entityWizard;
    this.summaryItems.forEach(item => {
      this.makeSummary(item.step, item.fieldName, item.label);
    })
  }

  parseSchema(catalogApp) {
    try {

      const gpuConfiguration = catalogApp.schema.questions.find(question => question.variable=='gpuConfiguration');
  
      if (gpuConfiguration && gpuConfiguration.schema.attrs.length > 0) {
        const fieldConfigs = this.entityUtils.parseSchemaFieldConfig(gpuConfiguration);
        const gpuWizardConfig = {
          label: gpuConfiguration.group,
          fieldConfig: fieldConfigs
        };

        this.wizardConfig.push(gpuWizardConfig);
      }
      
    } catch(error) {
      return this.dialogService.errorReport(helptext.chartForm.parseError.title, helptext.chartForm.parseError.message);
    }
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

  makeSummary(step: string | number, fieldName: string | number, label: string | number) {
    ( < FormGroup > this.entityWizard.formArray.get([step]).get(fieldName)).valueChanges
    .pipe(
      takeUntil(this.destroy$)
    )
    .subscribe((res) => {
      this.summary[(label)] = res;
    })
  }

  hideField(fieldName: any, show: boolean, entity: any) {
    let target = _.find(this.fieldConfig, {'name' : fieldName});
    target['isHidden'] = show;
    entity.setDisabled(fieldName, show, show);
  }

  customSubmit(data) {

    let parsedData = {};
    this.entityUtils.parseFormControlValues(data, parsedData);

    let envVars = [];
    if (data.containerEnvironmentVariables[0].name) {
      envVars = data.containerEnvironmentVariables;
    }

    let pfList = [];
    if (data.portForwardingList[0].containerPort) {
      pfList = data.portForwardingList;
    }

    let hpVolumes = [];
    if (data.hostPathVolumes[0].hostPath) {
      hpVolumes = data.hostPathVolumes;
    }

    let volList = [];
    if (data.volumes[0].datasetName) {
      volList = data.volumes;
    }

    let ext_interfaces = [];
    if (data.externalInterfaces[0].hostInterface) {
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

    let payload = [{
      catalog: 'OFFICIAL',
      item: 'ix-chart',
      release_name: data.release_name,
      train: 'charts',
      version: 'latest',
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
    }];

    if (parsedData['gpuConfiguration']) {
      payload[0].values['gpuConfiguration'] = parsedData['gpuConfiguration'];
    }

    this.dialogRef = this.mdDialog.open(EntityJobComponent, { data: { 'title': (
      helptext.installing) }, disableClose: true});
    this.dialogRef.componentInstance.setCall(this.addCall, payload);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe(() => {
      this.dialogService.closeAllDialogs();
      this.modalService.close('slide-in-form');
      this.modalService.refreshTable();
    });
  }

  ngOnDestroy(){
    this.destroy$.next();
    this.destroy$.complete(); 
  }

}