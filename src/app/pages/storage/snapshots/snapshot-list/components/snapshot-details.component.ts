import { Component, Input } from "@angular/core";
import { EntityTableComponent } from "app/pages/common/entity/entity-table";
import { EntityTableRowDetailComponent } from "app/pages/common/entity/entity-table/entity-table-row-detail.interface";
import { WebSocketService } from "app/services";
import { Observable } from "rxjs";
import { map, shareReplay } from "rxjs/operators";

@Component({
  selector: "app-snapshot-details",
  templateUrl: "./snapshot-details.component.html"
})
export class SnapshotDetailsComponent implements EntityTableRowDetailComponent<{ name: string }> {
  @Input() public config: { name: string };
  @Input() public parent: EntityTableComponent;

  public snapshot$: Observable<any>;

  constructor(private _ws: WebSocketService) {}

  public ngOnInit(): void {
    this.snapshot$ = this._ws.call("zfs.snapshot.query", [[["name", "=", this.config.name]], { select: ["name", "properties"] }]).pipe(
      map(response => response[0].properties),
      shareReplay(1)
    );
  }
}
