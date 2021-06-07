import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { forkJoin, of } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import helptext from 'app/helptext/apps/apps';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { WebSocketService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { DialogService } from 'app/services/index';
import { ModalService } from 'app/services/modal.service';
import { ApplicationsService } from '../applications.service';

@UntilDestroy()
@Component({
  selector: 'app-kubernetes-settings',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class KubernetesSettingsComponent implements FormConfiguration {
  queryCall: 'kubernetes.config' = 'kubernetes.config';
  editCall: 'kubernetes.update' = 'kubernetes.update';
  isEditJob = true;
  private newEnableContainerImageUpdate = true;
  title = helptext.kubForm.title;
  private entityEdit: EntityFormComponent;
  fieldConfig: FieldConfig[];
  fieldSets: FieldSet[] = [
    {
      name: 'kubernetes_settings',
      width: '50%',
      config: [
        {
          type: 'select',
          name: 'pool',
          placeholder: helptext.kubForm.pool.placeholder,
          tooltip: helptext.kubForm.pool.tooltip,
          options: [],
          required: true,
        },
        {
          type: 'input',
          name: 'cluster_cidr',
          placeholder: helptext.kubForm.cluster_cidr.placeholder,
          tooltip: helptext.kubForm.cluster_cidr.tooltip,
          required: true,
        },
        {
          type: 'input',
          name: 'service_cidr',
          placeholder: helptext.kubForm.service_cidr.placeholder,
          tooltip: helptext.kubForm.service_cidr.tooltip,
          required: true,
        },
        {
          type: 'input',
          name: 'cluster_dns_ip',
          placeholder: helptext.kubForm.cluster_dns_ip.placeholder,
          tooltip: helptext.kubForm.cluster_dns_ip.tooltip,
          required: true,
        },
        {
          type: 'select',
          name: 'node_ip',
          placeholder: helptext.kubForm.node_ip.placeholder,
          tooltip: helptext.kubForm.node_ip.tooltip,
          options: [],
        },
      ],
    }, {
      name: 'interfaces',
      width: '50%',
      config: [
        {
          type: 'select',
          name: 'route_v4_interface',
          placeholder: helptext.kubForm.route_v4_interface.placeholder,
          tooltip: helptext.kubForm.route_v4_interface.tooltip,
          options: [{ label: '---', value: null }],
        },
        {
          type: 'input',
          name: 'route_v4_gateway',
          placeholder: helptext.kubForm.route_v4_gateway.placeholder,
          tooltip: helptext.kubForm.route_v4_gateway.tooltip,
        },
        {
          type: 'checkbox',
          name: 'enable_container_image_update',
          placeholder: helptext.kubForm.enable_container_image_update.placeholder,
          tooltip: helptext.kubForm.enable_container_image_update.tooltip,
          value: true,
        },
      ],
    },
  ];

  constructor(protected ws: WebSocketService, private loader: AppLoaderService,
    private dialogService: DialogService, private modalService: ModalService,
    private appService: ApplicationsService) { }

  async prerequisite(): Promise<boolean> {
    const setPoolControl = this.appService.getPoolList().pipe(
      tap((pools) => {
        const poolControl = _.find(this.fieldSets[0].config, { name: 'pool' });
        pools.forEach((pool) => {
          poolControl.options.push({ label: pool.name, value: pool.name });
        });
      }),
    );

    const setNodeIpControl = this.appService.getBindIPChoices().pipe(
      tap((ips) => {
        const nodeIpControl = _.find(this.fieldSets[0].config, { name: 'node_ip' });
        for (const ip in ips) {
          nodeIpControl.options.push({ label: ip, value: ip });
        }
      }),
    );

    const setV4InterfaceControl = this.appService.getInterfaces().pipe(
      tap((interfaces: any[]) => {
        const v4InterfaceControl = _.find(this.fieldSets[1].config, { name: 'route_v4_interface' });
        interfaces.forEach((i) => {
          v4InterfaceControl.options.push({ label: i.name, value: i.name });
        });
      }),
    );

    return forkJoin([setPoolControl, setNodeIpControl, setV4InterfaceControl]).pipe(
      map(() => true),
      catchError((error) => {
        console.error(error);
        return of(false);
      }),
    ).toPromise();
  }

  afterInit(entityEdit: EntityFormComponent): void {
    this.entityEdit = entityEdit;
    this.appService.getContainerConfig().pipe(untilDestroyed(this)).subscribe((res) => {
      if (res) {
        this.entityEdit.formGroup.controls['enable_container_image_update'].setValue(res.enable_image_updates);
      }
    });
  }

  beforeSubmit(data: any): void {
    if (data.route_v4_gateway === '') {
      data.route_v4_gateway = null;
    }
    if (data.route_v6_gateway === '') {
      data.route_v6_gateway = null;
    }

    this.newEnableContainerImageUpdate = data.enable_container_image_update;
    delete data.enable_container_image_update;
  }

  customSubmit(data: any): void {
    this.loader.open();

    const promises = [];
    promises.push(this.ws.job(this.editCall, [data]).toPromise());
    promises.push(this.appService.updateContainerConfig(this.newEnableContainerImageUpdate).toPromise());

    Promise.all(promises).then(() => {
      this.loader.close();
      this.modalService.close('slide-in-form');
      this.modalService.refreshTable();
    }, (err) => {
      this.loader.close();
      new EntityUtils().handleWSError(this, err, this.dialogService);
    });
  }
}
