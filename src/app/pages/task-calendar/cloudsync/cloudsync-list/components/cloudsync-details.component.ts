import { Component, Input, OnInit } from "@angular/core";
import { EntityTableComponent } from "app/pages/common/entity/entity-table";
import {
  EntityAction,
  EntityDetail,
  EntityRowDetails
} from "app/pages/common/entity/entity-table/entity-row-details.interface";
import { EntityUtils } from "app/pages/common/entity/utils";
import { T } from "app/translate-marker";
import { CloudsyncListComponent } from "../cloudsync-list.component";

@Component({
  selector: "app-cloudsync-details",
  template: '<app-entity-row-details [conf]="this"></app-entity-row-details>'
})
export class CloudsyncDetailsComponent implements OnInit, EntityRowDetails {
  public readonly entityName = "cloudsync";

  @Input() public config: any;
  @Input() public parent: EntityTableComponent & { conf: CloudsyncListComponent };

  public details: EntityDetail[] = [];
  public actions: EntityAction[] = [];

  public ngOnInit(): void {
    this.actions = [
      {
        id: "start",
        name: this.config.id,
        icon: "play_arrow",
        label: T("Run Now"),
        onClick: row => {
          this.parent.conf.dialog.confirm(T("Run Now"), T("Run this cloud sync now?"), true).subscribe(res => {
            if (res) {
              row.state = "RUNNING";
              this.parent.conf.ws.call("cloudsync.sync", [row.id]).subscribe(
                res => {
                  this.parent.conf.translateService.get("close").subscribe(close => {
                    this.parent.conf.entityList.snackBar.open(T("Cloud sync has started."), close, { duration: 5000 });
                  });
                  this.parent.conf.job.getJobStatus(res).subscribe(task => {
                    row.state = task.state;
                    row.job = task;
                    row.status = task.state;
                    if (task.error) {
                      row.status += ":" + task.error;
                    }
                    if (task.progress.description && task.state !== "SUCCESS") {
                      row.status += ":" + task.progress.description;
                    }
                  });
                },
                err => {
                  new EntityUtils().handleWSError(this.parent.conf.entityList, err);
                }
              );
            }
          });
        }
      },
      {
        id: "stop",
        name: this.config.id,
        icon: "stop",
        label: T("Stop"),
        onClick: row => {
          this.parent.conf.dialog.confirm(T("Stop"), T("Stop this cloud sync?"), true).subscribe(res => {
            if (res) {
              this.parent.conf.ws.call("cloudsync.abort", [row.id]).subscribe(
                wsRes => {
                  this.parent.conf.translateService.get("close").subscribe(close => {
                    this.parent.conf.entityList.snackBar.open(T("Cloud sync stopped."), close, { duration: 5000 });
                  });
                },
                wsErr => {
                  new EntityUtils().handleWSError(this.parent.conf.entityList, wsErr);
                }
              );
            }
          });
        }
      },
      {
        id: "edit",
        name: this.config.id,
        icon: "edit",
        label: T("Edit"),
        onClick: row => {
          this.parent.conf.route_edit.push(row.id);
          this.parent.conf.router.navigate(this.parent.conf.route_edit);
        }
      },
      {
        id: "delete",
        name: this.config.id,
        icon: "delete",
        label: T("Delete"),
        onClick: row => {
          this.parent.conf.entityList.doDelete(row);
        }
      }
    ];

    const isDefinedAndColumnHidden = detail =>
      (typeof detail.value === "boolean" || !!detail.value) &&
      !this.parent.conf.columns.some(col => col.name === detail.label && col.hidden);

    this.details = [
      { label: T("Schedule"), value: this.config.schedule },
      { label: T("Next Run"), value: this.config.next_run },
      { label: T("Direction"), value: this.config.direction },
      { label: T("Credential"), value: this.config.credential }
    ].filter(isDefinedAndColumnHidden);
  }
}
