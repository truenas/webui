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
      name: 'chart_release_settings',
      config: [
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
          placeholder: helptext.chartForm.repository.placeholder,
          tooltip: helptext.chartForm.repository.tooltip,
          required: true
        },
        {
          type: 'input',
          name: 'catalog',
          placeholder: helptext.chartForm.catalog.placeholder,
          tooltip: helptext.chartForm.catalog.tooltip,
          required: true,
          value: 'OFFICIAL'
        },
        {
          type: 'input',
          name: 'item',
          placeholder: helptext.chartForm.item.placeholder,
          tooltip: helptext.chartForm.item.tooltip,
          required: true,
          value: 'ix-chart'
        },
        {
          type: 'input',
          name: 'train',
          placeholder: helptext.chartForm.train.placeholder,
          tooltip: helptext.chartForm.train.tooltip,
          required: true,
          value: 'test'
        },
        {
          type: 'input',
          name: 'version',
          placeholder: helptext.chartForm.version.placeholder,
          tooltip: helptext.chartForm.version.tooltip,
          required: true,
          value: 'latest'
        },
        {
          type: 'input',
          name: 'container_port',
          placeholder: helptext.chartForm.container_port.placeholder,
          tooltip: helptext.chartForm.container_port.tooltip,
          // required: true,
        },
        {
          type: 'input',
          name: 'node_port',
          placeholder: helptext.chartForm.node_port.placeholder,
          tooltip: helptext.chartForm.node_port.tooltip,
          // required: true,
        },

      ]
    }
  ]

  constructor(private mdDialog: MatDialog, private dialogService: DialogService,
    private modalService: ModalService) {
      this.getRow = this.modalService.getRow$.subscribe(rowId => {
        this.rowNum = rowId;
        console.log(rowId)
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