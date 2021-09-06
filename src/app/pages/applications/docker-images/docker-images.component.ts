import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { latestVersion } from 'app/constants/catalog.constants';
import { PreferencesService } from 'app/core/services/preferences.service';
import helptext from 'app/helptext/apps/apps';
import { ContainerImage, PullContainerImageParams } from 'app/interfaces/container-image.interface';
import { CoreEvent } from 'app/interfaces/events';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { FormSelectConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { DialogService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { ModalService } from 'app/services/modal.service';
import { WebSocketService } from 'app/services/ws.service';
import { PullImageFormComponent } from '../forms/pull-image-form.component';

@UntilDestroy()
@Component({
  selector: 'app-docker-images',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class DockerImagesComponent implements EntityTableConfig, OnInit {
  title = 'Docker Images';

  protected entityList: EntityTableComponent;
  protected loaderOpen = false;
  queryCall: 'container.image.query' = 'container.image.query';
  wsDelete: 'container.image.delete' = 'container.image.delete';
  disableActionsConfig = true;
  addComponent: PullImageFormComponent;

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

  filterString = '';
  constructor(private mdDialog: MatDialog,
    protected dialogService: DialogService, protected loader: AppLoaderService,
    protected ws: WebSocketService, protected prefService: PreferencesService,
    private modalService: ModalService) {
  }

  chooseTag: DialogFormConfiguration = {
    title: helptext.dockerImages.chooseTag.title,
    fieldConfig: [{
      type: 'select',
      name: 'tag',
      placeholder: helptext.dockerImages.chooseTag.selectTag.placeholder,
      required: true,
    }],
    saveButtonText: helptext.dockerImages.chooseTag.action,
    customSubmit: this.updateImage,
    parent: this,
  };

  ngOnInit(): void {
    this.refreshUserForm();

    this.modalService.refreshForm$.pipe(untilDestroyed(this)).subscribe(() => {
      this.refreshUserForm();
    });
  }

  refreshUserForm(): void {
    this.addComponent = new PullImageFormComponent(this.mdDialog, this.dialogService, this.modalService);
  }

  refresh(): void {
    this.entityList.getData();
    this.entityList.filter(this.filterString);
  }

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
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
        this.onClickUpdateImage(row);
      },
    }, {
      id: row.id,
      icon: 'delete',
      label: helptext.dockerImages.menu.delete,
      name: 'delete',
      onClick: (row: ContainerImage) => {
        this.entityList.doDelete(row);
      },
    });

    return actions as EntityTableAction[];
  }

  resourceTransformIncomingRestData(d: ContainerImage[]): ContainerImage[] {
    const data: ContainerImage[] = [];
    d.forEach((row) => {
      if (!row.system_image) {
        row.state = row.update_available ? helptext.dockerImages.updateAvailable : '';
        data.push(row);
      }
    });
    return data;
  }

  doAdd(): void {
    this.modalService.open('slide-in-form', this.addComponent);
  }

  onToolbarAction(evt: CoreEvent): void {
    if (evt.data.event_control == 'filter') {
      this.filterString = evt.data.filter;
      this.entityList.filter(this.filterString);
    } else if (evt.data.event_control == 'pull_image') {
      this.doAdd();
    }
  }

  onClickUpdateImage(row: ContainerImage): void {
    if (row.repo_tags.length > 0) {
      const config: FormSelectConfig = this.chooseTag.fieldConfig[0];
      config.options = row.repo_tags.map((item) => ({
        label: item,
        value: item,
      }));
      this.chooseTag.fieldConfig[0].value = row.repo_tags[0];
      this.dialogService.dialogForm(this.chooseTag, true);
    }
  }

  updateImage(entityDialog: EntityDialogComponent): void {
    const self = entityDialog.parent;
    const tag = entityDialog.formGroup.controls['tag'].value;
    const params = tag.split(':');
    const payload: [PullContainerImageParams] = [{
      from_image: params[0],
      tag: params.length > 1 ? params[1] : latestVersion,
    }];

    self.dialogRef = self.mdDialog.open(EntityJobComponent, {
      data: {
        title: helptext.dockerImages.pulling,
      },
    });
    self.dialogRef.componentInstance.setCall('container.image.pull', payload);
    self.dialogRef.componentInstance.submit();
    self.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      self.dialogService.closeAllDialogs();
      self.modalService.refreshTable();
    });
  }
}
