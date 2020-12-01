import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../common/entity/entity-form/models/fieldset.interface';
import { ModalService } from 'app/services/modal.service';
import { WebSocketService, DialogService } from '../../../services/index';
import { ApplicationsService } from '../applications.service';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import  helptext  from '../../../helptext/apps/apps';

@Component({
  selector: 'app-chart-release-settings',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class ChartReleaseSettingsComponent {
  protected queryCall: string = 'chart.release.query';
  protected queryCallOption: Array<any>;
  protected addCall: string = 'chart.release.create';
  protected editCall: string = 'chart.release.update';
  protected isEntity: boolean = true;

  private title = helptext.chartForm.title;
  private entityEdit: any;
  private dialogRef: any;
  private getRow = new Subscription;

  private rowNum: any;
  protected fieldConfig: FieldConfig[];
  public fieldSets: FieldSet[] = [
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
          required: true
        },
        {
          type: 'select',
          name: 'pullPolicy',
          placeholder: helptext.chartForm.image.pullPolicy.placeholder,
          tooltip: helptext.chartForm.image.pullPolicy.tooltip,
          options: helptext.chartForm.image.pullPolicy.options
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
        // env varialbe name and value
    {
      name: helptext.chartForm.networking,
      label: true,
      width: '50%',
      config: [
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
          type: 'input',
          name: 'staticIP',
          placeholder: helptext.chartForm.externalInterfaces.staticConfig.placeholder,
          required: true,
          isHidden: true,
          disabled: true,
          relation: [
            {
              action: 'SHOW',
              when: [{
                name: 'ipam',
                value: 'static',
              }]
            },
          ]
        },
        {
          type: 'input',
          name: 'destination',
          placeholder: helptext.chartForm.externalInterfaces.staticRoutes.destination.placeholder,
          required: true,
          isHidden: true,
          disabled: true,
          relation: [
            {
              action: 'SHOW',
              when: [{
                name: 'ipam',
                value: 'static',
              }]
            },
          ]
        },        {
          type: 'input',
          name: 'gateway',
          placeholder: helptext.chartForm.externalInterfaces.staticRoutes.gateway.placeholder,
          required: true,          isHidden: true,
          disabled: true,
          relation: [
            {
              action: 'SHOW',
              when: [{
                name: 'ipam',
                value: 'static',
              }]
            },
          ]
        }
      ]
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
      name: helptext.chartForm.hostNetwork.title,
      label: true,
      width: '50%',
      config: [
        {
          type: 'checkbox',
          name: 'hostNetwork',
          placeholder: helptext.chartForm.hostNetwork.placeholder,
          tooltip: helptext.chartForm.hostNetwork.tooltip,
          value: false
        },
        {
          type: 'input',
          name: 'hpl_containerPort',
          placeholder: helptext.chartForm.hostPortsList.containerPort.placeholder,
          required: true
        },       
        {
          type: 'input',
          name: 'hpl_hostPort',
          placeholder: helptext.chartForm.hostPortsList.hostPort.placeholder,
          required: true
        },
        {
          type: 'input',
          name: 'pfl_containerPort',
          placeholder: helptext.chartForm.portForwardingList.containerPort.placeholder,
          required: true
        }, 
        {
          type: 'input',
          name: 'pfl_nodePort',
          placeholder: helptext.chartForm.portForwardingList.nodePort.placeholder,
          required: true
        },  
        {
          type: 'select',
          name: 'pfl_protocol',
          placeholder: helptext.chartForm.portForwardingList.protocol.placeholder,
          options: helptext.chartForm.portForwardingList.protocol.options,
          value: helptext.chartForm.portForwardingList.protocol.options[0].value
        }
      ]
    },
    {
      name: helptext.chartForm.hostPathVolumes.title,
      label: true,
      width: '50%',
      config: [
        {
          type: 'input',
          name: 'hpv_hostpath',
          placeholder: helptext.chartForm.hostPathVolumes.hostPath.placeholder,
          tooltip: helptext.chartForm.hostPathVolumes.hostPath.tooltip,
          required: true
        }, 
        {
          type: 'input',
          name: 'hpv_mountpath',
          placeholder: helptext.chartForm.hostPathVolumes.mountPath.placeholder,
          tooltip: helptext.chartForm.hostPathVolumes.mountPath.tooltip,
          required: true
        },
        {
          type: 'checkbox',
          name: 'hpv_readonly',
          placeholder: helptext.chartForm.hostPathVolumes.readOnly.placeholder,
        }
      ]
    },
    {
      name: helptext.chartForm.volumes.title,
      label: true,
      width: '50%',
      config: [
        {
          type: 'input',
          name: 'vol_mountpath',
          placeholder: helptext.chartForm.volumes.mountPath.placeholder,
          tooltip: helptext.chartForm.volumes.mountPath.tooltip,
          required: true
        },
        {
          type: 'input',
          name: 'vol_datasetName',
          placeholder: helptext.chartForm.volumes.datasetName.placeholder,
          tooltip: helptext.chartForm.volumes.datasetName.tooltip,
          required: true
        }
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
        },



        /////////////////

        // {
        //   type: 'input',
        //   name: 'release_name',
        //   placeholder: helptext.chartForm.release_name.placeholder,
        //   tooltip: helptext.chartForm.release_name.tooltip,
        //   required: true
        // },
        // {
        //   type: 'input',
        //   name: 'repository',
        //   placeholder: helptext.chartForm.repository.placeholder,
        //   tooltip: helptext.chartForm.repository.tooltip,
        //   required: true
        // },
        // {
        //   type: 'input',
        //   name: 'catalog',
        //   placeholder: helptext.chartForm.catalog.placeholder,
        //   tooltip: helptext.chartForm.catalog.tooltip,
        //   required: true,
        //   value: 'OFFICIAL'
        // },
        // {
        //   type: 'input',
        //   name: 'item',
        //   placeholder: helptext.chartForm.item.placeholder,
        //   tooltip: helptext.chartForm.item.tooltip,
        //   required: true,
        //   value: 'ix-chart'
        // },
        // {
        //   type: 'input',
        //   name: 'train',
        //   placeholder: helptext.chartForm.train.placeholder,
        //   tooltip: helptext.chartForm.train.tooltip,
        //   required: true,
        //   value: 'test'
        // },
        // {
        //   type: 'input',
        //   name: 'version',
        //   placeholder: helptext.chartForm.version.placeholder,
        //   tooltip: helptext.chartForm.version.tooltip,
        //   required: true,
        //   value: 'latest'
        // },
        // {
        //   type: 'input',
        //   name: 'container_port',
        //   placeholder: helptext.chartForm.container_port.placeholder,
        //   tooltip: helptext.chartForm.container_port.tooltip,
        //   required: true
        // },
        // {
        //   type: 'input',
        //   name: 'node_port',
        //   placeholder: helptext.chartForm.node_port.placeholder,
        //   tooltip: helptext.chartForm.node_port.tooltip,
        //   required: true,
        //   validation: helptext.chartForm.node_port.validation
        // },

      ]
    }
  ]

  constructor(private mdDialog: MatDialog, private dialogService: DialogService,
    private modalService: ModalService) {
      this.getRow = this.modalService.getRow$.subscribe(rowId => {
        this.rowNum = rowId;
        this.queryCallOption = [['name', '=', rowId]];
        this.getRow.unsubscribe();
    })
  }

  resourceTransformIncomingRestData(data) {
    console.log(data);
    data['release_name'] = data.name;
    data['repository'] = data.config.image.repository;
    data['item'] = data.chart_metadata.name;
    data['train'] = data.catalog_train;
    data['container_port'] = data.config.portForwardingList[0].containerPort;
    data['node_port'] = data.config.portForwardingList[0].nodePort;
    return data;
  }

  customSubmit(data) {
    console.log(data)

    if (!this.rowNum) {
      let payload = {
        release_name: data.release_name,
        version: data.version,
        train: data.train,
        catalog: data.catalog,
        item: data.item,
        values: {
          image: { repository: data.repository }, 
          portForwardingList: [
                  {containerPort: data.container_port, nodePort: data.node_port}
          ], 
          volumes: [
              {datasetName: 'transcode', mountPath: '/transcode'}, 
              {datasetName: 'config', mountPath: '/config'}, 
              {datasetName: 'data', mountPath: '/data'}
            ], 
          workloadType: 'Deployment',
          // gpuConfiguration: {nvidia.com/gpu": 1}
        }
      }
  
      console.log(payload)
  
      this.dialogRef = this.mdDialog.open(EntityJobComponent, { data: { 'title': (
        helptext.installing) }, disableClose: true});
      this.dialogRef.componentInstance.setCall(this.addCall, [payload]);
      this.dialogRef.componentInstance.submit();
      this.dialogRef.componentInstance.success.subscribe((res) => {
        this.dialogService.closeAllDialogs();
        this.modalService.close('slide-in-form');
        this.modalService.refreshTable();
        // We should go to chart tab(?) and refresh
      });
      this.dialogRef.componentInstance.failure.subscribe((err) => {
        // new EntityUtils().handleWSError(this, err, this.dialogService);
      })
    } else {
      let payload = {
        values: {
          image: { repository: data.repository }, 
          portForwardingList: [
                  {containerPort: data.container_port, nodePort: data.node_port}
          ], 
        }
      }
  
      console.log(payload)
  
      this.dialogRef = this.mdDialog.open(EntityJobComponent, { data: { 'title': (
        helptext.installing) }, disableClose: true});
      this.dialogRef.componentInstance.setCall(this.editCall, [data.release_name, payload]);
      this.dialogRef.componentInstance.submit();
      this.dialogRef.componentInstance.success.subscribe((res) => {
        this.dialogService.closeAllDialogs();
        this.modalService.close('slide-in-form');
        this.modalService.refreshTable();
        // We should go to chart tab(?) and refresh
      });
      this.dialogRef.componentInstance.failure.subscribe((err) => {
        // new EntityUtils().handleWSError(this, err, this.dialogService);
      })

    }

  }

}