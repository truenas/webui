import { Component, Input } from "@angular/core";
import { Router } from "@angular/router";
import { EntityTableComponent } from "app/pages/common/entity/entity-table";
import {
  EntityAction,
  EntityTableRowDetailComponent
} from "app/pages/common/entity/entity-table/entity-table-row-detail.interface";
import { T } from "app/translate-marker";
import * as _ from "lodash";
import { DiskListComponent } from "../disk-list.component";

@Component({
  selector: "app-disk-details",
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
  templateUrl: "./disk-details.component.html"
})
export class DiskDetailsComponent implements EntityTableRowDetailComponent {
  @Input() public config: any;
  @Input() public parent: EntityTableComponent & { conf: DiskListComponent };

  public actions: EntityAction[] = [];

  constructor(private _router: Router) {}

  public ngOnInit(): void {
    this.actions = [
      {
        id: this.config.identifier,
        name: "edit",
        label: T("Edit"),
        buttonColor: "primary",
        onClick: row => this._router.navigate(new Array("/").concat(["storage", "disks", "edit", row.identifier]))
      }
    ];

    if (_.find(this.parent.conf.unused, { name: this.config.name })) {
      this.actions.unshift({
        id: this.config.identifier,
        name: "wipe",
        label: T("Wipe"),
        buttonColor: "warn",
        onClick: row => this._router.navigate(new Array("/").concat(["storage", "disks", "wipe", row.name]))
      });
    }
  }
}
