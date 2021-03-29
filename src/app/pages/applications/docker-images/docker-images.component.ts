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
@Component({
  selector: 'app-docker-images',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
})

export class DockerImagesComponent implements OnInit {
  public title = "Docker Images";

  protected entityList: any;
  protected loaderOpen = false;
  protected queryCall = 'docker.images.query';
  protected wsDelete = 'docker.images.delete';
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
    actions.push({
      id: row.id,
      icon: 'edit',
      label : helptext.dockerImages.menu.update,
      name: 'update',
      onClick : (row) => {
        this.updateImage(row);
      }
    }, {
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
    let data = Object.assign([], d);
    data = data.map(row => {
      row.state = row.update_available?helptext.dockerImages.updateAvailable:'';
      return row;
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

  updateImage(row) {
    
  }

}


