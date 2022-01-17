import { Component, Input, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { map } from 'rxjs/operators';
import { Option } from 'app/interfaces/option.interface';
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import {
  EntityAction,
  EntityRowDetails,
} from 'app/modules/entity/entity-table/entity-row-details/entity-row-details.interface';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { WebSocketService, StorageService, SystemGeneralService } from 'app/services';
import { LocaleService } from 'app/services/locale.service';
import { SnapshotListComponent } from '../snapshot-list.component';

@UntilDestroy()
@Component({
  selector: 'app-snapshot-details',
  template: `
    <app-entity-row-details [conf]="this"></app-entity-row-details>
  `,
})
export class SnapshotDetailsComponent implements EntityRowDetails<{ name: string }>, OnInit {
  readonly entityName: 'snapshot';
  // public locale: string;
  timezone: string;

  @Input() config: { name: string };
  @Input() parent: EntityTableComponent & { conf: SnapshotListComponent };

  details: Option[] = [];
  actions: EntityAction[] = [];

  constructor(
    private ws: WebSocketService,
    private localeService: LocaleService,
    protected storageService: StorageService,
    private sysGeneralService: SystemGeneralService,
  ) {}

  ngOnInit(): void {
    this.sysGeneralService.getGeneralConfig$.pipe(untilDestroyed(this)).subscribe((res) => {
      this.timezone = res.timezone;
      this.ws
        .call('zfs.snapshot.query', [[['id', '=', this.config.name]]])
        .pipe(
          map((response) => ({
            ...response[0].properties,
            name: this.config.name,
            creation: this.localeService.formatDateTime(response[0].properties.creation.parsed.$date, this.timezone),
          })),
          untilDestroyed(this),
        ).subscribe((snapshot: ZfsSnapshot['properties'] & { name: string; creation: string }) => {
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

    this.actions = this.parent.conf.getActions() as EntityAction[];
  }
}
