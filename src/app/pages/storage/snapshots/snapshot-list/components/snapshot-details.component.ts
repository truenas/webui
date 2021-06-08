import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { map } from 'rxjs/operators';
import { Option } from 'app/interfaces/option.interface';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table';
import {
  EntityAction,
  EntityRowDetails,
} from 'app/pages/common/entity/entity-table/entity-row-details.interface';
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
export class SnapshotDetailsComponent implements EntityRowDetails<{ name: string }> {
  readonly entityName: 'snapshot';
  // public locale: string;
  timezone: string;

  @Input() config: { name: string };
  @Input() parent: EntityTableComponent & { conf: SnapshotListComponent };

  details: Option[] = [];
  actions: EntityAction[] = [];

  constructor(private _ws: WebSocketService, private _router: Router, private localeService: LocaleService,
    protected storageService: StorageService, private sysGeneralService: SystemGeneralService) {}

  ngOnInit(): void {
    this.sysGeneralService.getGeneralConfig.pipe(untilDestroyed(this)).subscribe((res) => {
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
        .pipe(untilDestroyed(this)).subscribe((snapshot) => {
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
