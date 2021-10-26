import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { latestVersion } from 'app/constants/catalog.constants';
import helptext from 'app/helptext/apps/apps';
import { PullContainerImageParams } from 'app/interfaces/container-image.interface';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { DialogService } from 'app/services/index';
import { ModalService } from 'app/services/modal.service';

interface PullImageFormValues {
  from_image: string;
  tag: string;
  username: string;
  password: string;
}

@UntilDestroy()
@Component({
  selector: 'app-pull-image-form',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class PullImageFormComponent implements FormConfiguration {
  queryCall = 'container.image.query' as const;
  addCall = 'container.image.pull' as const;
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
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.dialogService.closeAllDialogs();
      this.modalService.closeSlideIn();
      this.modalService.refreshTable();
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((error) => {
      new EntityUtils().handleWSError(this, error, this.dialogService);
    });
  }
}
