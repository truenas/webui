import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { latestVersion } from 'app/constants/catalog.constants';
import { PullContainerImageParams } from 'app/interfaces/container-image.interface';
import * as _ from 'lodash';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../common/entity/entity-form/models/fieldset.interface';
import { ModalService } from '../../../services/modal.service';
import { DialogService } from '../../../services/index';
import helptext from '../../../helptext/apps/apps';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { WebSocketService } from '../../../services/ws.service';
import { EntityUtils } from '../../common/entity/utils';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';

interface PullImageFormValues {
  from_image: string;
  tag: string;
  username: string;
  password: string;
}

@Component({
  selector: 'app-pull-image-form',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class PullImageFormComponent implements FormConfiguration {
  queryCall: 'container.image.query' = 'container.image.query';
  addCall: 'container.image.pull' = 'container.image.pull';
  isEntity = true;
  protected entityForm: EntityFormComponent;
  title = helptext.pullImageForm.title;
  fieldConfig: FieldConfig[];
  fieldSets: FieldSet[] = [
    {
      name: helptext.pullImageForm.label,
      label: true,
      width: '100%',
      config: [
        {
          type: 'input',
          name: 'username',
          placeholder: helptext.pullImageForm.username.placeholder,
          tooltip: helptext.pullImageForm.username.tooltip,
        },
        {
          type: 'input',
          name: 'password',
          inputType: 'password',
          togglePw: true,
          placeholder: helptext.pullImageForm.password.placeholder,
          tooltip: helptext.pullImageForm.password.tooltip,
        },
      ],
    },
    {
      name: 'divider',
      divider: true,
    },
    {
      name: 'Name',
      width: '100%',
      config: [
        {
          type: 'input',
          name: 'from_image',
          placeholder: helptext.pullImageForm.imageName.placeholder,
          tooltip: helptext.pullImageForm.imageName.tooltip,
          required: true,
        },
        {
          type: 'input',
          name: 'tag',
          placeholder: helptext.pullImageForm.imageTags.placeholder,
          tooltip: helptext.pullImageForm.imageTags.tooltip,
          value: latestVersion,
        },
      ],
    },
  ];

  constructor(
    private mdDialog: MatDialog,
    private dialogService: DialogService,
    private modalService: ModalService,
  ) {}

  customSubmit(data: PullImageFormValues): void {
    const params: PullContainerImageParams = {
      from_image: data.from_image,
    };

    if (data.tag) {
      params.tag = data.tag;
    }
    if (data.username || data.password) {
      params.docker_authentication = {
        username: data.username,
        password: data.password,
      };
    }

    const dialogRef = this.mdDialog.open(EntityJobComponent, {
      data: {
        title: helptext.dockerImages.pulling,
      },
      disableClose: true,
    });
    dialogRef.componentInstance.setCall('container.image.pull', [params]);
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.subscribe(() => {
      this.dialogService.closeAllDialogs();
      this.modalService.close('slide-in-form');
      this.modalService.refreshTable();
    });
    dialogRef.componentInstance.failure.subscribe((error: any) => {
      new EntityUtils().handleWSError(this, error, this.dialogService);
    });
  }
}
