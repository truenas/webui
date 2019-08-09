import { Component, Input } from "@angular/core";
import { Router } from "@angular/router";
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

  constructor(private _ws: WebSocketService, private _router: Router) {}

  public ngOnInit(): void {
    this._ws
      .call("zfs.snapshot.query", [[["id", "=", this.config.name]]])
      .pipe(
        map(response => ({
          ...response[0].properties,
          name: this.config.name,
          creation: response[0].properties.creation.value
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
  }
}
