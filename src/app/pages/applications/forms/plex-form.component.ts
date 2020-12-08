import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { DialogService, WebSocketService } from '../../../services/index';
import { SystemGeneralService } from 'app/services/system-general.service';
import { map } from 'rxjs/operators';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../common/entity/entity-form/models/fieldset.interface';
import { ModalService } from '../../../services/modal.service';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import  helptext  from '../../../helptext/apps/apps';

@Component({
  selector: 'app-chart-release-edit',
  template: `<entity-form [conf]="this"></entity-form>`,
  // providers: [SystemGeneralService]
})
export class PlexFormComponent {
  protected queryCall: string = 'chart.release.query';
  protected queryCallOption: Array<any>;
  protected editCall: string = 'chart.release.update';
  protected isEntity: boolean = true;

  private title= 'Plex';
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
          name: 'name',
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
      name: 'Misc.',
      label: true,
      width: '50%',
      config: [
        {
          type: 'input',
          name: 'claimToken',
          placeholder: 'Claim Token',
        },
        {
          type: 'combobox',
          name: 'timezone',
          placeholder: 'Timezone',
          options: [{ label: "---", value: null }],
        },
        {
          type: 'checkbox',
          name: 'hostNetwork',
          placeholder: 'Host Network',
        },
      ]
    },
    {
      name: 'Extra Environment Variables',
      label: true,
      config: [
        {
          type: 'list',
          name: 'extraEnv',
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
      name: 'Plexservice TCP',
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
              name: 'plexServiceTCP',
              placeholder: 'Plexservice TCP',
              validation: helptext.chartForm.portForwardingList.containerPort.validation,
            }
          ],
          listFields: []
        }
      ],
      colspan: 2,
    },
    {
      name: helptext.chartForm.container.title,
      // label: true,
      width: '50%',
      config: [
        {
          type: 'checkbox',
          name: 'transcodeHostPathEnabled',
          placeholder: 'Transcode Hostpath Enabled',
        },
        {
          type: 'input',
          name: 'transcodeHostPath',
          placeholder: 'Transcode Hostpath',
          isHidden: true,
          relation: [
            {
              action: 'SHOW',
              when: [{
                name: 'transcodeHostPathEnabled',
                value: true,
              }]
            },
          ],
        },
        {
          type: 'checkbox',
          name: 'dataHostPathEnabled',
          placeholder: 'Data Hostpath Enabled',
        },
        {
          type: 'input',
          name: 'dataHostPath',
          placeholder: 'Data Hostpath',
          isHidden: true,
          relation: [
            {
              action: 'SHOW',
              when: [{
                name: 'dataPathEnabled',
                value: true,
              }]
            },
          ],
        },
        {
          type: 'checkbox',
          name: 'configHostPathEnabled',
          placeholder: 'Config Hostpath Enabled',
        },
        {
          type: 'input',
          name: 'configHostPath',
          placeholder: 'Config Hostpath',
          isHidden: true,
          relation: [
            {
              action: 'SHOW',
              when: [{
                name: 'configPathEnabled',
                value: true,
              }]
            },
          ],
        },

      ]
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
    private modalService: ModalService, private ws: WebSocketService) {
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
    // let extIntfg = _.find(this.fieldConfig, {'name': 'externalInterfaces'});
    // let staticRoutesfg = _.find(extIntfg.templateListField, {'name': 'staticRoutes'});
    // let staticIPfg = _.find(extIntfg.templateListField, {'name': 'staticIPConfigurations'});
    // entityEdit.formGroup.controls['externalInterfaces'].valueChanges.subscribe(value => {
    //   if (value[0].ipam === 'static') {
    //     staticIPfg.isHidden = false;
    //     staticRoutesfg.isHidden = false;
    //   } else {
    //     staticIPfg.isHidden = true;
    //     staticRoutesfg.isHidden = true;
    //   }
    // })

    let tzs = this.ws.call("system.general.timezone_choices", []).pipe(
      map(response =>
        Object.keys(response || {}).map(key => ({
          label: response[key],
          value: key
        }))
      )
    );
    console.log(tzs)
    // this.ws.call().subscribe(tzChoices => {
    //   tzChoices = _.sortBy(tzChoices, [function(o) { return o.label.toLowerCase(); }]);
    //   this.fieldSets
    //     .find(set => set.name === 'Misc.')
    //     .config.find(config => config.name === 'timezone').options = tzChoices;
    //     // entityEdit.formGroup.controls['timezone'].setValue(this.configData.timezone);
    // });
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
        // gpuConfiguration: {data.gpu_property : data['gpu_value']},
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
