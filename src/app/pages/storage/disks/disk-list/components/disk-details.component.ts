import { Component, Input, OnInit } from "@angular/core";
import { Disk } from "app/core/components/widgets/widgetpool/widgetpool.component";
import { EntityTableComponent } from "app/pages/common/entity/entity-table";
import {
  EntityAction,
  EntityDetail,
  EntityRowDetails
} from "app/pages/common/entity/entity-table/entity-row-details.interface";
import { T } from "app/translate-marker";
import * as _ from "lodash";
import { DiskListComponent } from "../disk-list.component";

@Component({
  selector: "app-disk-details",
  template: '<app-entity-row-details [conf]="this"></app-entity-row-details>'
})
export class DiskDetailsComponent implements EntityRowDetails<Disk>, OnInit {
  public readonly entityName = "disk";

  @Input() config: Disk;
  @Input() parent: EntityTableComponent & { conf: DiskListComponent };

  public details: EntityDetail[] = [];
  public actions: EntityAction[] = [];

  public ngOnInit(): void {
    console.log({ disk: this.config });

    this.actions.push({
      id: "edit",
      name: this.config.name,
      icon: "edit",
      label: T("Edit"),
      onClick: row =>
        this.parent.conf.router.navigate(new Array("/").concat(["storage", "disks", "edit", row.identifier]))
    });

    if (_.find(this.parent.conf.unused, { name: this.config.name })) {
      this.actions.push({
        id: "wipe",
        name: this.config.name,
        icon: "delete",
        label: T("Wipe"),
        onClick: row => this.parent.conf.router.navigate(new Array("/").concat(["storage", "disks", "wipe", row.name]))
      });
    }

    /* Build details */
    this.details = [
      { label: T("Serial"), value: this.config.serial },
      { label: T("Model"), value: this.config.model },
      { label: T("Rotation Rate (RPM)"), value: this.config.rotationrate },
      { label: T("Description"), value: this.config.description },
      { label: T("Transfer Mode"), value: this.config.transfermode },
      { label: T("HDD Standby"), value: this.config.hddstandby },
      { label: T("Adv. Power Management"), value: this.config.advpowermgmt },
      { label: T("Acoustic Level"), value: this.config.acousticlevel },
      { label: T("Enable S.M.A.R.T."), value: this.config.togglesmart },
      { label: T("S.M.A.R.T. extra options"), value: this.config.smartoptions },
      { label: T("Password for SED"), value: this.config.passwd }
    ].filter(detail => !!detail.value);
  }
}
