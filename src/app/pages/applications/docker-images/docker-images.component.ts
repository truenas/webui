import { Component, OnInit } from '@angular/core';
import { ApplicationsService } from '../applications.service';
import { MatDialog } from '@angular/material/dialog';
import { DialogService, StorageService, ValidationService } from 'app/services';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { WebSocketService } from '../../../services/ws.service';
import { PreferencesService } from 'app/core/services/preferences.service';
import { ModalService } from '../../../services/modal.service';
import  helptext  from '../../../helptext/apps/apps';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import {PullImageFormComponent} from '../forms/pull-image-form.component';
import { EntityUtils } from '../../common/entity/utils';
import { DialogFormConfiguration } from '../../common/entity/entity-dialog/dialog-form-configuration.interface';
@Component({
  selector: 'app-docker-images',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
})

export class DockerImagesComponent implements OnInit {
  public title = "Docker Images";

  protected entityList: any;
  protected loaderOpen = false;
  protected queryCall = 'container.image.query';
  protected wsDelete = 'container.image.delete';
  protected disableActionsConfig = true;
  private dialogRef: any;
  private refreshTableSubscription: any;
  protected addComponent: PullImageFormComponent;

  public columns: Array < any > = [
    { name: helptext.dockerImages.columns.id, prop: 'id', always_display: true},
    { name: helptext.dockerImages.columns.tags, prop: 'repo_tags', always_display: true},
    { name: helptext.dockerImages.columns.state, prop: 'state', always_display: true},
  ];

  public rowIdentifier = 'id';
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Catalog',
      key_props: ['id']
    }
  };

  public filterString: string = '';
  constructor(private mdDialog: MatDialog,
              protected dialogService: DialogService, protected loader: AppLoaderService,
              protected ws: WebSocketService, protected prefService: PreferencesService,
              private modalService: ModalService) {
  }

  public chooseTag: DialogFormConfiguration = {
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
  }

  ngOnInit() {
    this.refreshUserForm();

    this.modalService.refreshForm$.subscribe(() => {
      this.refreshUserForm();
    });
  }

  refreshUserForm() {
    this.addComponent = new PullImageFormComponent(this.mdDialog,this.dialogService, this.modalService);
  }

  refresh() {
    this.entityList.getData();
    this.entityList.filter(this.filterString);
  }

  afterInit(entityList: any) {
    this.entityList = entityList;
  }

  getActions(row) {
    const actions = [];
    if (row.update_available) {
      actions.push({
        id: row.id,
        icon: 'edit',
        label : helptext.dockerImages.menu.update,
        name: 'update',
        onClick : (row) => {
          this.onClickUpdateImage(row);
        }
      });
    };

    actions.push({
      id: row.id,
      icon: 'delete',
      label : helptext.dockerImages.menu.delete,
      name: 'delete',
      onClick : (row) => {
        this.entityList.doDelete(row);
      }
    });

    return actions;
  }

  resourceTransformIncomingRestData(d) {
    const data = [];
    d.forEach(row => {
      if (!row.system_image) {
        row.state = row.update_available?helptext.dockerImages.updateAvailable:'';
        data.push(row);
      }
    })
    return data;
  }


  doAdd() {
    this.modalService.open('slide-in-form', this.addComponent);
  }

  onToolbarAction(evt: CoreEvent) {
    if (evt.data.event_control == 'filter') {
      this.filterString = evt.data.filter;
      this.entityList.filter(this.filterString);
    } else if (evt.data.event_control == 'pull_image') {
      this.doAdd();
    }
  }

  onClickUpdateImage(row) {
    if (row.repo_tags.length > 0) {
      this.chooseTag.fieldConfig[0].options = row.repo_tags.map(item => {
        return {
          label: item,
          value: item,
        }
      });
      this.chooseTag.fieldConfig[0].value = row.repo_tags[0];
      this.dialogService.dialogForm(this.chooseTag, true);
    }
  }

  updateImage(entityDialog: any) {
    const self = entityDialog.parent;
    const tag = entityDialog.formGroup.controls['tag'].value;
    const params = tag.split(":");
    const payload = [{
      from_image: params[0],
      tag: params.length>1?params[1]:'latest'
    }];

    self.dialogRef = self.mdDialog.open(EntityJobComponent, { data: { 'title': (
      helptext.dockerImages.pulling) }, disableClose: true});
    self.dialogRef.componentInstance.setCall("container.image.pull", payload);
    self.dialogRef.componentInstance.submit();
    self.dialogRef.componentInstance.success.subscribe(() => {
      self.dialogService.closeAllDialogs();
      self.modalService.refreshTable();
    });
  }
}


