import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { StorageService } from 'app/services/storage.service';
import helptext from 'app/helptext/data-protection/smart/smart';
import { T } from 'app/translate-marker';
import { SmartFormComponent } from '../smart-form/smart-form.component';
import { ModalService } from 'app/services/modal.service';
import { Router, ActivatedRoute } from '@angular/router';
import { EntityFormService } from 'app/pages/common/entity/entity-form/services/entity-form.service';
import { TaskService } from 'app/services';
import { WebSocketService } from '../../../../services/ws.service';

@Component({
  selector: 'app-smart-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
  providers: [TaskService, EntityFormService],
})
export class SmartListComponent implements OnDestroy {
  public title = 'S.M.A.R.T. Tests';
  public queryCall = 'smart.test.query';
  protected route_add: string[] = ['tasks', 'smart', 'add'];
  protected route_add_tooltip = 'Add S.M.A.R.T. Test';
  protected route_edit: string[] = ['tasks', 'smart', 'edit'];
  protected wsDelete = 'smart.test.delete';
  private disksSubscription: Subscription;

  public columns: Array<any> = [
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
  public rowIdentifier = 'type';
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'S.M.A.R.T. Test',
      key_props: ['type', 'desc'],
    },
  };
  public listDisks: any[] = [];

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

  resourceTransformIncomingRestData(data: any[]) {
    return data.map((test) => {
      test.schedule = `${test.schedule.hour} ${test.schedule.dom} ${test.schedule.month} ${test.schedule.dow}`;
      if (test.all_disks) {
        test.disks = [T('All Disks')];
      } else if (test.disks.length) {
        const readableDisks = test.disks.map((disk: any) => {
          return this.listDisks.find((item) => item.identifier === disk).devname;
        });
        test.disks = readableDisks;
      }
      return test;
    });
  }

  doAdd(id?: number) {
    this.modalService.open('slide-in-form', new SmartFormComponent(this.ws, this.modalService), id);
  }

  doEdit(id: number) {
    this.doAdd(id);
  }

  ngOnDestroy() {
    if (this.disksSubscription) {
      this.disksSubscription.unsubscribe();
    }
  }
}
