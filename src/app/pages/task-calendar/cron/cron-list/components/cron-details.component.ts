import { Component, Input, OnInit } from "@angular/core";
import { EntityTableComponent } from "app/pages/common/entity/entity-table";
import {
  EntityAction,
  EntityDetail,
  EntityRowDetails
} from "app/pages/common/entity/entity-table/entity-row-details.interface";
import { EntityUtils } from "app/pages/common/entity/utils";
import { T } from "app/translate-marker";
import { filter, switchMap } from "rxjs/operators";
import { CronListComponent } from "../cron-list.component";

@Component({
  selector: "app-cron-details",
  template: '<app-entity-row-details [conf]="this"></app-entity-row-details>'
})
export class CronDetailsComponent implements EntityRowDetails<any>, OnInit {
  public readonly entityName: "cron";

  @Input() public config: any;
  @Input() public parent: EntityTableComponent & { conf: CronListComponent };

  public details: EntityDetail[] = [];
  public actions: EntityAction[] = [];

  public ngOnInit(): void {
    const isDefinedAndColumnHidden = detail =>
      (typeof detail.value === "boolean" || !!detail.value) &&
      !this.parent.conf.columns.some(col => col.name === detail.label && col.hidden);

    this.details = [
      { label: T("Next Run"), value: this.config.cron_next_run },
      { label: T("Minute"), value: this.config.cron_minute },
      { label: T("Hour"), value: this.config.cron_hour },
      { label: T("Day of Month"), value: this.config.cron_daymonth },
      { label: T("Month"), value: this.config.cron_month },
      { label: T("Day of Week"), value: this.config.cron_dayweek },
      { label: T("Hide Stdout"), value: this.config.cron_stdout },
      { label: T("Hide Stderr"), value: this.config.cron_stderr }
    ].filter(isDefinedAndColumnHidden);

    this.actions = [
      {
        name: this.config.name,
        label: T("Run Now"),
        id: "run",
        icon: "play_arrow",
        onClick: row =>
          this.parent.conf.dialog
            .confirm(T("Run Now"), T("Run this cron job now?"), true)
            .pipe(
              filter(run => !!run),
              switchMap(() =>
                this.parent.conf.rest.post(this.parent.conf.resource_name + "/" + row.id + "/run/", {})
              )
            )
            .subscribe(
              res =>
                this.parent.conf.translate.get("close").subscribe(close => {
                  this.parent.conf.entityList.snackBar.open(res.data, close, { duration: 5000 });
                }),
              err => new EntityUtils().handleError(this, err)
            )
      },
      {
        name: this.config.name,
        label: T("Edit"),
        icon: "edit",
        id: "edit",
        onClick: row => this.parent.conf.router.navigate(new Array("/").concat(["tasks", "cron", "edit", row.id]))
      },
      {
        id: "delete",
        name: this.config.name,
        icon: "delete",
        label: T("Delete"),
        onClick: row => this.parent.conf.entityList.doDelete(row)
      }
    ];
  }
}
