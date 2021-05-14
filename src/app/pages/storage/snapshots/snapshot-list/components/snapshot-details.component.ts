import { Component, Input, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Option } from 'app/interfaces/option.interface';
import { Subscription } from 'rxjs';
import helptext from 'app/helptext/storage/snapshots/snapshots';
import {
  EntityAction,
  EntityRowDetails,
} from 'app/pages/common/entity/entity-table/entity-row-details.interface';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table';
import { WebSocketService, StorageService, SystemGeneralService } from 'app/services';
import { map } from 'rxjs/operators';
import { SnapshotListComponent } from '../snapshot-list.component';
import { LocaleService } from 'app/services/locale.service';

@Component({
  selector: 'app-snapshot-details',
  template: `
    <app-entity-row-details [conf]="this"></app-entity-row-details>
  `,
})
export class SnapshotDetailsComponent implements EntityRowDetails<{ name: string }> {
  readonly entityName: 'snapshot';
  // public locale: string;
  timezone: string;
  getGenConfig: Subscription;

  @Input() config: { name: string };
  @Input() parent: EntityTableComponent & { conf: SnapshotListComponent };

  details: Option[] = [];
  actions: EntityAction[] = [];

  constructor(private _ws: WebSocketService, private _router: Router, private localeService: LocaleService,
    protected storageService: StorageService, private sysGeneralService: SystemGeneralService) {}

  ngOnInit(): void {
    this.getGenConfig = this.sysGeneralService.getGeneralConfig.subscribe((res) => {
      this.timezone = res.timezone;
      this._ws
        .call('zfs.snapshot.query', [[['id', '=', this.config.name]]])
        .pipe(
          map((response) => ({
            ...response[0].properties,
            name: this.config.name,
            creation: this.localeService.formatDateTime(response[0].properties.creation.parsed.$date, this.timezone),
          })),
        )
        .subscribe((snapshot) => {
          this.details = [
            {
              label: 'Date created',
              value: snapshot.creation,
            },
            {
              label: 'Used',
              value: this.storageService.convertBytestoHumanReadable(snapshot.used.rawvalue),
            },
            {
              label: 'Referenced',
              value: this.storageService.convertBytestoHumanReadable(snapshot.referenced.rawvalue),
            },
          ];
        });
    });

    this.actions = this.parent.conf.getActions();
  }

  ngOnDestroy(): void {
    this.getGenConfig.unsubscribe();
  }
}
