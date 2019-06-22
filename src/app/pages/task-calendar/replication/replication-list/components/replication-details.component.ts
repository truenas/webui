import { Component, Input } from "@angular/core";
import {
  EntityAction,
  EntityDetail,
  EntityRowDetails
} from "app/pages/common/entity/entity-row-details/entity-row-details.interface";
import { EntityTableComponent } from "app/pages/common/entity/entity-table";
import { EntityUtils } from "app/pages/common/entity/utils";
import { T } from "app/translate-marker";
import { ReplicationListComponent } from "../replication-list.component";

@Component({
  selector: "app-replication-details",
  template: '<app-entity-row-details [conf]="this"></app-entity-row-details>'
})
export class ReplicationDetailsComponent implements EntityRowDetails {
  public readonly entityName = "replication";

  @Input() public config: any;
  @Input() public parent: EntityTableComponent & { conf: ReplicationListComponent };

  public details: EntityDetail[] = [];
  public actions: EntityAction[] = [];

  public ngOnInit(): void {
    this.details = [
      { label: "Direction", value: this.config.direction },
      { label: "Transport", value: this.config.transport },
      { label: "SSH Connection", value: this.config.ssh_connection },
      { label: "Recursive", value: this.config.recursive },
      { label: "Auth", value: this.config.auto }
    ];

    this.actions = [
      {
        id: "run",
        name: this.config.name,
        icon: "play_arrow",
        label: T("Run Now"),
        onClick: row => {
          this.parent.conf.dialog
            .confirm(T("Run Now"), T("Replicate <i>") + row.name + T("</i> now?"), true)
            .subscribe(res => {
              if (res) {
                row.state = "RUNNING";
                this.parent.conf.ws.call("replication.run", [row.id]).subscribe(
                  () => {
                    this.parent.conf.snackbarService.open(
                      T("Replication <i>") + row.name + T("</i> has started."),
                      T("close"),
                      {
                        duration: 5000
                      }
                    );
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
        id: "edit",
        name: this.config.name,
        icon: "edit",
        label: T("Edit"),
        onClick: row => {
          this.parent.conf.route_edit.push(row.id);
          this.parent.conf.router.navigate(this.parent.conf.route_edit);
        }
      },
      {
        id: "delete",
        name: this.config.name,
        icon: "delete",
        label: T("Delete"),
        onClick: row => {
          this.parent.conf.entityList.doDelete(row);
        }
      }
    ];
  }
}
