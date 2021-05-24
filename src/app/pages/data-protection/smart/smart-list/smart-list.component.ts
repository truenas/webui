import { Router, ActivatedRoute } from '@angular/router';
import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { StorageService } from 'app/services/storage.service';
import helptext from 'app/helptext/data-protection/smart/smart';
import { T } from 'app/translate-marker';
import { SmartFormComponent } from 'app/pages/data-protection/smart/smart-form/smart-form.component';
import { ModalService } from 'app/services/modal.service';
import { EntityFormService } from 'app/pages/common/entity/entity-form/services/entity-form.service';
import { TaskService, WebSocketService } from 'app/services';
import { InputTableConf } from 'app/pages/common/entity/table/table.component';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table';

@Component({
  selector: 'app-smart-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
  providers: [TaskService, EntityFormService],
})
export class SmartListComponent implements InputTableConf, OnDestroy {
  title = T('S.M.A.R.T. Tests');
  queryCall = 'smart.test.query';
  route_add: string[] = ['tasks', 'smart', 'add'];
  route_add_tooltip = 'Add S.M.A.R.T. Test';
  route_edit: string[] = ['tasks', 'smart', 'edit'];
  wsDelete = 'smart.test.delete';
  entityList: EntityTableComponent;
  parent: any;

  columns: any[] = [
    {
      name: helptext.smartlist_column_disks,
      prop: 'disks',
      always_display: true,
    },
    {
      name: helptext.smartlist_column_type,
      prop: 'type',
      always_display: true,
    },
    { name: helptext.smartlist_column_description, prop: 'desc' },
    { name: helptext.smartlist_column_schedule, prop: 'schedule' },
  ];
  rowIdentifier = 'type';
  config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: T('S.M.A.R.T. Test'),
      key_props: ['type', 'desc'],
    },
  };
  listDisks: any[] = [];
  private disksSubscription: Subscription;
  private onModalClose: Subscription;

  constructor(
    protected ws: WebSocketService,
    protected storageService: StorageService,
    protected modalService: ModalService,
    protected router: Router,
    protected aroute: ActivatedRoute,
    protected taskService: TaskService,
    protected entityFormService: EntityFormService,
  ) {
    this.disksSubscription = this.storageService.listDisks().subscribe((listDisks) => {
      this.listDisks = listDisks;
    });
  }

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
    this.onModalClose = this.modalService.onClose$.subscribe(() => {
      this.entityList.getData();
    });
  }

  resourceTransformIncomingRestData(data: any[]): any[] {
    return data.map((test) => {
      test.schedule = `${test.schedule.hour} ${test.schedule.dom} ${test.schedule.month} ${test.schedule.dow}`;
      if (test.all_disks) {
        test.disks = [T('All Disks')];
      } else if (test.disks.length) {
        const readableDisks = test.disks.map((disk: any) => this.listDisks.find((item) => item.identifier === disk).devname);
        test.disks = readableDisks;
      }
      return test;
    });
  }

  doAdd(id?: number): void {
    this.modalService.open('slide-in-form', new SmartFormComponent(this.ws, this.modalService), id);
  }

  doEdit(id: number): void {
    this.doAdd(id);
  }

  ngOnDestroy(): void {
    this.disksSubscription?.unsubscribe();
    this.onModalClose?.unsubscribe();
  }
}
