import { Component, Input } from "@angular/core";
import { Router } from "@angular/router";
import { SystemGeneralService } from '../../../../../services/';
import helptext from "app/helptext/storage/snapshots/snapshots";
import {
  EntityAction,
  EntityRowDetails
} from "app/pages/common/entity/entity-table/entity-row-details.interface";
import { EntityTableComponent } from "app/pages/common/entity/entity-table";
import { WebSocketService } from "app/services";
import { map } from "rxjs/operators";
import { SnapshotListComponent } from "../snapshot-list.component";

@Component({
  selector: "app-snapshot-details",
  template: `
    <app-entity-row-details [conf]="this"></app-entity-row-details>
  `
})
export class SnapshotDetailsComponent implements EntityRowDetails<{ name: string }> {
  public readonly entityName: "snapshot";

  @Input() public config: { name: string };
  @Input() public parent: EntityTableComponent & { conf: SnapshotListComponent };

  public details: { label: string; value: string | number }[] = [];
  public actions: EntityAction[] = [];

  constructor(private _ws: WebSocketService, private _router: Router,
    protected sysGenService: SystemGeneralService) {}

  public timeZone: string;

  public ngOnInit(): void {
    this.sysGenService.getSysInfo().subscribe((res) => {
      this.timeZone = res.timezone;
      this._ws
      .call("zfs.snapshot.query", [[["id", "=", this.config.name]]])
      .pipe(
        map(response => ({
          ...response[0].properties,
          name: this.config.name,
          creation:  new Date(response[0].properties.creation.parsed.$date)
          .toLocaleString('en-US', {timeZone: this.timeZone})
        }))
      )
      .subscribe(snapshot => {
        this.details = [
          {
            label: "Date created",
            value: snapshot.creation
          },
          {
            label: "Used",
            value: snapshot.used.value
          },
          {
            label: "Referenced",
            value: snapshot.referenced.value
          }
        ];
      });
    })
    this.actions = this.parent.conf.getActions();
  }
}
