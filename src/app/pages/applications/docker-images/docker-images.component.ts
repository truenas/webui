import {
  AfterViewInit, Component, TemplateRef, ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { latestVersion } from 'app/constants/catalog.constants';
import helptext from 'app/helptext/apps/apps';
import { ContainerImage, PullContainerImageParams } from 'app/interfaces/container-image.interface';
import { DialogFormConfiguration } from 'app/modules/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/modules/entity/entity-dialog/entity-dialog.component';
import { FormSelectConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig, EntityTableConfirmDialog } from 'app/modules/entity/entity-table/entity-table.interface';
import { PullImageFormComponent } from 'app/pages/applications/forms/pull-image-form/pull-image-form.component';
import { DialogService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LayoutService } from 'app/services/layout.service';

@UntilDestroy()
@Component({
  selector: 'ix-docker-images',
  templateUrl: './docker-images.component.html',
})
export class DockerImagesComponent implements EntityTableConfig, AfterViewInit {
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;

  title = this.translate.instant('Docker Images');

  protected entityList: EntityTableComponent;
  queryCall = 'container.image.query' as const;
  wsDelete = 'container.image.delete' as const;
  disableActionsConfig = true;
  confirmDeleteDialog: EntityTableConfirmDialog = {};

  wsDeleteParams(_: unknown, id: string): unknown[] {
    return [id, { force: this.forceDelete }];
  }

  columns = [
    { name: helptext.dockerImages.columns.id, prop: 'id', always_display: true },
    { name: helptext.dockerImages.columns.tags, prop: 'repo_tags', always_display: true },
    { name: helptext.dockerImages.columns.state, prop: 'state', always_display: true },
  ];

  rowIdentifier = 'id';
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Catalog',
      key_props: ['id'],
    },
  };

  forceDelete: boolean;
  filterString = '';
  constructor(
    protected dialogService: DialogService,
    private slideInService: IxSlideInService,
    private matDialog: MatDialog,
    private translate: TranslateService,
    private layoutService: LayoutService,
  ) {}

  chooseTag: DialogFormConfiguration = {
    title: helptext.dockerImages.chooseTag.title,
    fieldConfig: [{
      type: 'select',
      name: 'tag',
      placeholder: helptext.dockerImages.chooseTag.selectTag.placeholder,
      required: true,
    }],
    saveButtonText: helptext.dockerImages.chooseTag.action,
    customSubmit: (entityDialog) => this.updateImage(entityDialog),
  };

  refresh(): void {
    this.entityList.getData();

    if (this.filterString) {
      this.entityList.filter(this.filterString);
    }
  }

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;

    this.slideInService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      this.entityList.getData();
    });
  }

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }

  getActions(row: ContainerImage): EntityTableAction[] {
    const actions = [];
    actions.push({
      id: row.id,
      icon: 'edit',
      label: helptext.dockerImages.menu.update,
      name: 'update',
      disabled: !row.update_available,
      onClick: (row: ContainerImage) => {
        delete this.confirmDeleteDialog.title;
        delete this.confirmDeleteDialog.button;
        this.onClickUpdateImage(row);
      },
    }, {
      id: row.id,
      icon: 'delete',
      label: helptext.dockerImages.menu.delete,
      name: 'delete',
      onClick: (row: ContainerImage) => {
        delete this.confirmDeleteDialog.title;
        delete this.confirmDeleteDialog.button;
        this.forceDelete = false;
        this.entityList.doDelete(row);
      },
    }, {
      id: row.id,
      icon: 'delete',
      label: helptext.dockerImages.menu.forceDelete,
      name: 'forceDelete',
      onClick: (row: ContainerImage) => {
        this.confirmDeleteDialog.title = this.translate.instant('Force delete');
        this.confirmDeleteDialog.button = this.translate.instant('Force delete');
        this.forceDelete = true;
        this.entityList.doDelete(row, this.translate.instant('Force delete'));
      },
    });

    return actions as EntityTableAction[];
  }

  onSearch(query: string): void {
    this.filterString = query;

    this.entityList.filter(this.filterString);
  }

  resourceTransformIncomingRestData(images: ContainerImage[]): ContainerImage[] {
    const transformedImage: ContainerImage[] = [];
    images.forEach((image) => {
      if (!image.system_image) {
        image.state = image.update_available ? helptext.dockerImages.updateAvailable : '';
        transformedImage.push(image);
      }
    });
    return transformedImage;
  }

  doAdd(): void {
    this.slideInService.open(PullImageFormComponent);
  }

  onClickUpdateImage(row: ContainerImage): void {
    if (row.repo_tags.length > 0) {
      const config = this.chooseTag.fieldConfig[0] as FormSelectConfig;
      config.options = row.repo_tags.map((item) => ({
        label: item,
        value: item,
      }));
      this.chooseTag.fieldConfig[0].value = row.repo_tags[0];
      this.dialogService.dialogForm(this.chooseTag, true);
    }
  }

  updateImage(entityDialog: EntityDialogComponent): void {
    const tag = entityDialog.formGroup.controls['tag'].value;
    const params = tag.split(':');
    const payload: [PullContainerImageParams] = [{
      from_image: params[0],
      tag: params.length > 1 ? params[1] : latestVersion,
    }];

    const dialogRef = this.matDialog.open(EntityJobComponent, {
      data: {
        title: helptext.dockerImages.pulling,
      },
    });
    dialogRef.componentInstance.setCall('container.image.pull', payload);
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.dialogService.closeAllDialogs();
      this.refresh();
    });
  }
}
