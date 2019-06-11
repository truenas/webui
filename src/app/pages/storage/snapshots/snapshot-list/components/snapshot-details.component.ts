import { Component, Input } from "@angular/core";
import { Router } from "@angular/router";
import helptext from "app/helptext/storage/snapshots/snapshots";
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
      p,
      h4 {
        color: var(--fg2) !important;
      }

      .button-delete {
        background: var(--red);
        color: var(--primary-txt) !important;
      }
    `
  ],
  templateUrl: "./snapshot-details.component.html"
})
export class SnapshotDetailsComponent implements EntityTableRowDetailComponent<{ name: string }> {
  @Input() public config: { name: string };
  @Input() public parent: EntityTableComponent & { conf: SnapshotListComponent };

  public snapshot$: Observable<any>;
  public actions: EntityAction[];

  constructor(private _ws: WebSocketService, private _router: Router) {}

  public ngOnInit(): void {
    this.snapshot$ = this._ws
      .call("zfs.snapshot.query", [[["name", "=", this.config.name]], { select: ["name", "properties"] }])
      .pipe(
        map(response => ({
          ...response[0].properties,
          name: this.config.name,
          creation: response[0].properties.creation.value
        }))
      );

    this.actions = [
      {
        id: "delete",
        name: this.config.name,
        label: helptext.label_delete,
        onClick: snapshot => this.parent.conf.doDelete(snapshot)
      },
      {
        id: "clone",
        name: this.config.name,
        label: helptext.label_clone,
        buttonColor: 'primary',
        onClick: snapshot =>
          this._router.navigate(new Array("/").concat(["storage", "snapshots", "clone", snapshot.name]))
      },
      {
        id: "rollback",
        name: this.config.name,
        label: helptext.label_rollback,
        buttonColor: 'primary',
        onClick: snapshot => this.parent.conf.doRollback(snapshot)
      }
    ];
  }
}
