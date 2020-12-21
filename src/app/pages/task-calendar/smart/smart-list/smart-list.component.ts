import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { StorageService } from 'app/services/storage.service';
import helptext from 'app/helptext/task-calendar/smart/smart';
import { T } from 'app/translate-marker';

@Component({
  selector: 'app-smart-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
})
export class SmartListComponent implements OnDestroy {
  public title = "S.M.A.R.T. Tests";
  public queryCall = "smart.test.query";
  protected route_add: string[] = ['tasks', 'smart', 'add'];
  protected route_add_tooltip = "Add S.M.A.R.T. Test";
  protected route_edit: string[] = ['tasks', 'smart', 'edit'];
  protected wsDelete = "smart.test.delete";
  private disksSubscription: Subscription;

  public columns: Array<any> = [
    { name: helptext.smartlist_column_disks, prop: 'disks', always_display: true },
    { name: helptext.smartlist_column_type, prop: 'type', always_display: true },
    { name: helptext.smartlist_column_description, prop: 'desc' },
    { name: helptext.smartlist_column_schedule, prop: 'schedule' }
  ];
  public rowIdentifier = 'type';
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'S.M.A.R.T. Test',
      key_props: ['type', 'desc']
    },
  };
  public listDisks = [];

  constructor(protected storageService: StorageService) {
    this.disksSubscription = this.storageService.listDisks().subscribe(listDisks => {
      this.listDisks = listDisks;
    });
  }

  resourceTransformIncomingRestData(data: any) {
    return data.map(test => {
      test.schedule = `${test.schedule.hour} ${test.schedule.dom} ${test.schedule.month} ${test.schedule.dow}`;
      if (test.all_disks) {
        test.disks = [T('All Disks')]
      } else if (test.disks.length) {
        const readableDisks = test.disks.map(disk => {
          return this.listDisks.find(item => item.identifier === disk).devname;
        });
        test.disks = readableDisks;
      }
      return test;
    });
  }

  ngOnDestroy() {
    if (this.disksSubscription) {
      this.disksSubscription.unsubscribe();
    }
  }
}
