import { Component, Input } from "@angular/core";
import { Router } from "@angular/router";
import { EntityTableComponent } from "app/pages/common/entity/entity-table";
import {
  EntityAction,
  EntityTableRowDetailComponent
} from "app/pages/common/entity/entity-table/entity-table-row-detail.interface";
import { WebSocketService } from "app/services";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { SnapshotListComponent } from "../snapshot-list.component";

@Component({
  selector: "app-snapshot-details",
  styles: [
    `
      .snapshot-buttons {
        color: var(--fg2) !important;
      }
    `
  ],
  templateUrl: "./snapshot-details.component.html"
})
export class SnapshotDetailsComponent implements EntityTableRowDetailComponent<{ name: string }> {
  @Input() public config: { name: string };
  @Input() public parent: SnapshotListComponent & EntityTableComponent;

  public snapshot$: Observable<any>;
  public actions: EntityAction[];

  constructor(private _ws: WebSocketService, private _router: Router) {}

  public ngOnInit(): void {
    this.snapshot$ = this._ws
      .call("zfs.snapshot.query", [[["name", "=", this.config.name]], { select: ["name", "properties"] }])
      .pipe(map(response => response[0].properties));

    this.actions = [
      {
        id: "delete",
        name: this.config.name,
        label: "Delete",
        buttonColor: "warn",
        onClick: snapshot => this.parent.doDelete(snapshot)
      },
      {
        id: "clone",
        name: this.config.name,
        label: "Clone",
        onClick: snapshot =>
          this._router.navigate(new Array("/").concat(["storage", "snapshots", "clone", snapshot.name]))
      },
      {
        id: "rollback",
        name: this.config.name,
        label: "Rollback",
        onClick: snapshot => this.parent.doRollback(snapshot)
      }
    ];
  }
}
