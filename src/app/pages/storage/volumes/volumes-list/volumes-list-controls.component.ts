import { Component, ElementRef, Input, ViewChild, OnInit, AfterViewInit, OnDestroy,} from '@angular/core';
import { Router } from '@angular/router';
//import { Subscription } from 'rxjs';
import { fromEvent as observableFromEvent, Observable, of, Subscription } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, switchMap, take, tap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

import { RestService } from '../../../../services/rest.service';
import { GlobalAction } from 'app/components/common/pagetitle/pagetitle.component';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { ModalService } from 'app/services/modal.service';
import { VolumeImportWizardComponent } from '../volume-import-wizard';
import { AppLoaderService, DialogService, WebSocketService } from 'app/services';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'app/pages/common/entity/entity-form/services/message.service';

@Component({
  selector : 'app-volumes-list-controls',
  templateUrl: './volumes-list-controls.component.html',
  providers: [ MessageService ]
})
export class VolumesListControlsComponent implements GlobalAction, OnInit, AfterViewInit, OnDestroy {
  @ViewChild('filter', { static: false}) filter: ElementRef;
  filterValue: string = '';
  @Input('entity') entity: any; // Can't specify VolumesListComponent without creating circular dependency;
  public conf;

  public actions: any[];
  public menuTriggerMessage:string = "Click for options";

  public spin: boolean = true;
  public direction: string = 'left';
  public animationMode: string = 'fling';
  get totalActions(){
    let addAction = this.entity.conf.route_add ? 1 : 0;
    return this.actions.length + addAction;
  }

  constructor(
    protected translate: TranslateService,
    public router: Router,
    public core: CoreService,
    public modalService: ModalService,
    protected rest: RestService,
    protected ws: WebSocketService,
    protected loader: AppLoaderService,
    protected dialog: MatDialog,
    protected dialogService: DialogService,
    protected http: HttpClient,
    public messageService: MessageService
  ) { }

  ngOnInit() { 
  }

  ngOnDestroy(){
  }

  ngAfterViewInit(){
    if (this.filter) {
      //this.entity.filter = this.filter;

      observableFromEvent(this.filter.nativeElement, 'keyup').pipe(
        debounceTime(250),
        distinctUntilChanged(),).subscribe((evt) => { 
          this.filterValue= this.filter.nativeElement.value ? this.filter.nativeElement.value : '';
          this.filterDatasets(this.filterValue);
        });

    }
  }

  applyConfig(config: any){
    if(config ){
      this.actions = config.getAddActions(); 
      this.conf = config.conf;
      this.entity = config;
    } else {
      throw "This component requires an entity class for a config"
    }
  }

  navigate(path: string){
    this.router.navigate(path.split('/'));
  }

  resetDatasetFilter(){
    this.filterValue = '';
    this.filter.nativeElement.value = '';
    this.filterDatasets('');
  }

  filterDatasets(value: string){
    this.core.emit({ 
      name:"TreeTableGlobalFilter", 
      data:{ column: "name", value: value } , 
      sender: this 
    });
  }

  onClickImport() {
    this.modalService.open('slide-in-form', new VolumeImportWizardComponent(this.rest, this.ws, this.router, this.loader, this.dialog, this.dialogService, this.http, this.messageService, this.modalService));
  }
}
