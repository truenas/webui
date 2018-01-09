import { Component, ElementRef, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { RestService } from '../../../../services/';
import { TourService } from '../../../../services/tour.service';
import filesize from 'filesize';
import { debug } from 'util';
import { EntityUtils } from '../../../common/entity/utils';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { AfterViewInit } from '@angular/core/src/metadata/lifecycle_hooks';
import { DownloadKeyModalDialog } from 'app/components/common/dialog/downloadkey/downloadkey-dialog.component';
import { MdDialog } from '@angular/material';


import { Injectable } from '@angular/core';

export class Employee {
  ID: string;
  Head_ID: string;
  Full_Name: string;
  Prefix: string;
  Title: string;
  City: string;
  State: string;
  Email: string;
  Skype: string;
  Mobile_Phone: string;
  Birth_Date: string;
  Hire_Date: string;
}

var employees: Employee[] = [{
  "ID": "1",
  "Head_ID": "0",
  "Full_Name": "John Heart",
  "Prefix": "Mr.",
  "Title": "CEO",
  "City": "Los Angeles",
  "State": "California",
  "Email": "jheart@dx-email.com",
  "Skype": "jheart_DX_skype",
  "Mobile_Phone": "(213) 555-9392",
  "Birth_Date": "1964-03-16",
  "Hire_Date": "1995-01-15"
}, {
  "ID": "2",
  "Head_ID": "1",
  "Full_Name": "Samantha Bright",
  "Prefix": "Dr.",
  "Title": "COO",
  "City": "Los Angeles",
  "State": "California",
  "Email": "samanthab@dx-email.com",
  "Skype": "samanthab_DX_skype",
  "Mobile_Phone": "(213) 555-2858",
  "Birth_Date": "1966-05-02",
  "Hire_Date": "2004-05-24"
}, {
  "ID": "3",
  "Head_ID": "1",
  "Full_Name": "Arthur Miller",
  "Prefix": "Mr.",
  "Title": "CTO",
  "City": "Denver",
  "State": "Colorado",
  "Email": "arthurm@dx-email.com",
  "Skype": "arthurm_DX_skype",
  "Mobile_Phone": "(310) 555-8583",
  "Birth_Date": "1972-07-11",
  "Hire_Date": "2007-12-18"
}, {
  "ID": "4",
  "Head_ID": "1",
  "Full_Name": "Robert Reagan",
  "Prefix": "Mr.",
  "Title": "CMO",
  "City": "Bentonville",
  "State": "Arkansas",
  "Email": "robertr@dx-email.com",
  "Skype": "robertr_DX_skype",
  "Mobile_Phone": "(818) 555-2387",
  "Birth_Date": "1974-09-07",
  "Hire_Date": "2002-11-08"
}, {
  "ID": "5",
  "Head_ID": "1",
  "Full_Name": "Greta Sims",
  "Prefix": "Ms.",
  "Title": "HR Manager",
  "City": "Atlanta",
  "State": "Georgia",
  "Email": "gretas@dx-email.com",
  "Skype": "gretas_DX_skype",
  "Mobile_Phone": "(818) 555-6546",
  "Birth_Date": "1977-11-22",
  "Hire_Date": "1998-04-23"
}, {
  "ID": "6",
  "Head_ID": "3",
  "Full_Name": "Brett Wade",
  "Prefix": "Mr.",
  "Title": "IT Manager",
  "City": "Reno",
  "State": "Nevada",
  "Email": "brettw@dx-email.com",
  "Skype": "brettw_DX_skype",
  "Mobile_Phone": "(626) 555-0358",
  "Birth_Date": "1968-12-01",
  "Hire_Date": "2009-03-06"
}, {
  "ID": "7",
  "Head_ID": "5",
  "Full_Name": "Sandra Johnson",
  "Prefix": "Mrs.",
  "Title": "Controller",
  "City": "Beaver",
  "State": "Utah",
  "Email": "sandraj@dx-email.com",
  "Skype": "sandraj_DX_skype",
  "Mobile_Phone": "(562) 555-2082",
  "Birth_Date": "1974-11-15",
  "Hire_Date": "2005-05-11"
}, {
  "ID": "8",
  "Head_ID": "4",
  "Full_Name": "Ed Holmes",
  "Prefix": "Dr.",
  "Title": "Sales Manager",
  "City": "Malibu",
  "State": "California",
  "Email": "edwardh@dx-email.com",
  "Skype": "edwardh_DX_skype",
  "Mobile_Phone": "(310) 555-1288",
  "Birth_Date": "1973-07-14",
  "Hire_Date": "2005-06-19"
}, {
  "ID": "9",
  "Head_ID": "3",
  "Full_Name": "Barb Banks",
  "Prefix": "Mrs.",
  "Title": "Support Manager",
  "City": "Phoenix",
  "State": "Arizona",
  "Email": "barbarab@dx-email.com",
  "Skype": "barbarab_DX_skype",
  "Mobile_Phone": "(310) 555-3355",
  "Birth_Date": "1979-04-14",
  "Hire_Date": "2002-08-07"
}, {
  "ID": "10",
  "Head_ID": "2",
  "Full_Name": "Kevin Carter",
  "Prefix": "Mr.",
  "Title": "Shipping Manager",
  "City": "San Diego",
  "State": "California",
  "Email": "kevinc@dx-email.com",
  "Skype": "kevinc_DX_skype",
  "Mobile_Phone": "(213) 555-2840",
  "Birth_Date": "1978-01-09",
  "Hire_Date": "2009-08-11"
}, {
  "ID": "11",
  "Head_ID": "5",
  "Full_Name": "Cindy Stanwick",
  "Prefix": "Ms.",
  "Title": "HR Assistant",
  "City": "Little Rock",
  "State": "Arkansas",
  "Email": "cindys@dx-email.com",
  "Skype": "cindys_DX_skype",
  "Mobile_Phone": "(818) 555-6655",
  "Birth_Date": "1985-06-05",
  "Hire_Date": "2008-03-24"
}, {
  "ID": "12",
  "Head_ID": "8",
  "Full_Name": "Sammy Hill",
  "Prefix": "Mr.",
  "Title": "Sales Assistant",
  "City": "Pasadena",
  "State": "California",
  "Email": "sammyh@dx-email.com",
  "Skype": "sammyh_DX_skype",
  "Mobile_Phone": "(626) 555-7292",
  "Birth_Date": "1984-02-17",
  "Hire_Date": "2012-02-01"
}, {
  "ID": "13",
  "Head_ID": "10",
  "Full_Name": "Davey Jones",
  "Prefix": "Mr.",
  "Title": "Shipping Assistant",
  "City": "Pasadena",
  "State": "California",
  "Email": "davidj@dx-email.com",
  "Skype": "davidj_DX_skype",
  "Mobile_Phone": "(626) 555-0281",
  "Birth_Date": "1983-03-06",
  "Hire_Date": "2011-04-24"
}, {
  "ID": "14",
  "Head_ID": "10",
  "Full_Name": "Victor Norris",
  "Prefix": "Mr.",
  "Title": "Shipping Assistant",
  "City": "Little Rock",
  "State": "Arkansas",
  "Email": "victorn@dx-email.com",
  "Skype": "victorn_DX_skype",
  "Mobile_Phone": "(213) 555-9278",
  "Birth_Date": "1986-07-23",
  "Hire_Date": "2012-07-23"
}, {
  "ID": "15",
  "Head_ID": "10",
  "Full_Name": "Mary Stern",
  "Prefix": "Ms.",
  "Title": "Shipping Assistant",
  "City": "Beaver",
  "State": "Utah",
  "Email": "marys@dx-email.com",
  "Skype": "marys_DX_skype",
  "Mobile_Phone": "(818) 555-7857",
  "Birth_Date": "1982-04-08",
  "Hire_Date": "2012-08-12"
}, {
  "ID": "16",
  "Head_ID": "10",
  "Full_Name": "Robin Cosworth",
  "Prefix": "Mrs.",
  "Title": "Shipping Assistant",
  "City": "Los Angeles",
  "State": "California",
  "Email": "robinc@dx-email.com",
  "Skype": "robinc_DX_skype",
  "Mobile_Phone": "(818) 555-0942",
  "Birth_Date": "1981-06-12",
  "Hire_Date": "2012-09-01"
}, {
  "ID": "17",
  "Head_ID": "9",
  "Full_Name": "Kelly Rodriguez",
  "Prefix": "Ms.",
  "Title": "Support Assistant",
  "City": "Boise",
  "State": "Idaho",
  "Email": "kellyr@dx-email.com",
  "Skype": "kellyr_DX_skype",
  "Mobile_Phone": "(818) 555-9248",
  "Birth_Date": "1988-05-11",
  "Hire_Date": "2012-10-13"
}, {
  "ID": "18",
  "Head_ID": "9",
  "Full_Name": "James Anderson",
  "Prefix": "Mr.",
  "Title": "Support Assistant",
  "City": "Atlanta",
  "State": "Georgia",
  "Email": "jamesa@dx-email.com",
  "Skype": "jamesa_DX_skype",
  "Mobile_Phone": "(323) 555-4702",
  "Birth_Date": "1987-01-29",
  "Hire_Date": "2012-10-18"
}, {
  "ID": "19",
  "Head_ID": "9",
  "Full_Name": "Antony Remmen",
  "Prefix": "Mr.",
  "Title": "Support Assistant",
  "City": "Boise",
  "State": "Idaho",
  "Email": "anthonyr@dx-email.com",
  "Skype": "anthonyr_DX_skype",
  "Mobile_Phone": "(310) 555-6625",
  "Birth_Date": "1986-02-19",
  "Hire_Date": "2013-01-19"
}, {
  "ID": "20",
  "Head_ID": "8",
  "Full_Name": "Olivia Peyton",
  "Prefix": "Mrs.",
  "Title": "Sales Assistant",
  "City": "Atlanta",
  "State": "Georgia",
  "Email": "oliviap@dx-email.com",
  "Skype": "oliviap_DX_skype",
  "Mobile_Phone": "(310) 555-2728",
  "Birth_Date": "1981-06-03",
  "Hire_Date": "2012-05-14"
}, {
  "ID": "21",
  "Head_ID": "6",
  "Full_Name": "Taylor Riley",
  "Prefix": "Mr.",
  "Title": "Network Admin",
  "City": "San Jose",
  "State": "California",
  "Email": "taylorr@dx-email.com",
  "Skype": "taylorr_DX_skype",
  "Mobile_Phone": "(310) 555-7276",
  "Birth_Date": "1982-08-14",
  "Hire_Date": "2012-04-14"
}, {
  "ID": "22",
  "Head_ID": "6",
  "Full_Name": "Amelia Harper",
  "Prefix": "Mrs.",
  "Title": "Network Admin",
  "City": "Los Angeles",
  "State": "California",
  "Email": "ameliah@dx-email.com",
  "Skype": "ameliah_DX_skype",
  "Mobile_Phone": "(213) 555-4276",
  "Birth_Date": "1983-11-19",
  "Hire_Date": "2011-02-10"
}, {
  "ID": "23",
  "Head_ID": "6",
  "Full_Name": "Wally Hobbs",
  "Prefix": "Mr.",
  "Title": "Programmer",
  "City": "Chatsworth",
  "State": "California",
  "Email": "wallyh@dx-email.com",
  "Skype": "wallyh_DX_skype",
  "Mobile_Phone": "(818) 555-8872",
  "Birth_Date": "1984-12-24",
  "Hire_Date": "2011-02-17"
}, {
  "ID": "24",
  "Head_ID": "6",
  "Full_Name": "Brad Jameson",
  "Prefix": "Mr.",
  "Title": "Programmer",
  "City": "San Fernando",
  "State": "California",
  "Email": "bradleyj@dx-email.com",
  "Skype": "bradleyj_DX_skype",
  "Mobile_Phone": "(818) 555-4646",
  "Birth_Date": "1988-10-12",
  "Hire_Date": "2011-03-02"
}, {
  "ID": "25",
  "Head_ID": "6",
  "Full_Name": "Karen Goodson",
  "Prefix": "Miss",
  "Title": "Programmer",
  "City": "South Pasadena",
  "State": "California",
  "Email": "kareng@dx-email.com",
  "Skype": "kareng_DX_skype",
  "Mobile_Phone": "(626) 555-0908",
  "Birth_Date": "1987-04-26",
  "Hire_Date": "2011-03-14"
}, {
  "ID": "26",
  "Head_ID": "5",
  "Full_Name": "Marcus Orbison",
  "Prefix": "Mr.",
  "Title": "Travel Coordinator",
  "City": "Los Angeles",
  "State": "California",
  "Email": "marcuso@dx-email.com",
  "Skype": "marcuso_DX_skype",
  "Mobile_Phone": "(213) 555-7098",
  "Birth_Date": "1982-03-02",
  "Hire_Date": "2005-05-19"
}, {
  "ID": "27",
  "Head_ID": "5",
  "Full_Name": "Sandy Bright",
  "Prefix": "Ms.",
  "Title": "Benefits Coordinator",
  "City": "Denver",
  "State": "Colorado",
  "Email": "sandrab@dx-email.com",
  "Skype": "sandrab_DX_skype",
  "Mobile_Phone": "(818) 555-0524",
  "Birth_Date": "1983-09-11",
  "Hire_Date": "2005-06-04"
}, {
  "ID": "28",
  "Head_ID": "6",
  "Full_Name": "Morgan Kennedy",
  "Prefix": "Mrs.",
  "Title": "Graphic Designer",
  "City": "San Fernando Valley",
  "State": "California",
  "Email": "morgank@dx-email.com",
  "Skype": "morgank_DX_skype",
  "Mobile_Phone": "(818) 555-8238",
  "Birth_Date": "1984-07-17",
  "Hire_Date": "2012-01-11"
}, {
  "ID": "29",
  "Head_ID": "28",
  "Full_Name": "Violet Bailey",
  "Prefix": "Ms.",
  "Title": "Jr Graphic Designer",
  "City": "La Canada",
  "State": "California",
  "Email": "violetb@dx-email.com",
  "Skype": "violetb_DX_skype",
  "Mobile_Phone": "(818) 555-2478",
  "Birth_Date": "1985-06-10",
  "Hire_Date": "2012-01-19"
}, {
  "ID": "30",
  "Head_ID": "5",
  "Full_Name": "Ken Samuelson",
  "Prefix": "Dr.",
  "Title": "Ombudsman",
  "City": "St. Louis",
  "State": "Missouri",
  "Email": "kents@dx-email.com",
  "Skype": "kents_DX_skype",
  "Mobile_Phone": "(562) 555-9282",
  "Birth_Date": "1972-09-11",
  "Hire_Date": "2009-04-22"
}];

@Injectable()
export class EmployeeService {
  getEmployees(): Employee[] {
    return employees;
  }
}



export interface ZfsPoolData {
  avail: number;
  id: string;
  is_decrypted: boolean;
  is_upgraded: boolean;
  mountpoint: string;
  name: string;
  status: string;
  used: number;
  sed_pct: string;
  vol_encrypt: number;
  vol_encryptkey: string;
  vol_guid: string;
  vol_name: string;
  children: any[];
  volumesListTableConfig: VolumesListTableConfig;

}


export class VolumesListTableConfig {
  protected hideTopActions = true;
  protected flattenedVolData: any;
  protected resource_name = 'storage/volume';
  protected route_add: string[] = ['storage', 'volumes', 'manager'];
  protected route_add_tooltip = "Create ZFS Pool";
  public dataset_data: any;

  constructor(
    private _router: Router,
    private _classId: string,
    private title: string,
    public mdDialog: MdDialog) {

    if (typeof (this._classId) !== "undefined" && this._classId !== "") {
      this.resource_name += "/" + this._classId;
    }
  }

  public columns: Array<any> = [
    { name: 'Name', prop: 'path', sortable: false },
    { name: 'Type', prop: 'type', sortable: false },
    { name: 'Used', prop: 'used', sortable: false },
    { name: 'Available', prop: 'avail', sortable: false },
    { name: 'Compression', prop: 'compression', sortable: false },
    { name: 'Readonly', prop: 'readonly', sortable: false },
    { name: 'Dedup', prop: 'dedup', sortable: false }

  ];

  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
  };


  dataHandler(EntityTable: any) {
    for (let i = 0; i < EntityTable.rows.length; i++) {
      if (!EntityTable.rows[i].path) {
        EntityTable.rows[i].path = EntityTable.rows[i].name;
      }
    }
  }

  rowValue(row, attr) {
    switch (attr) {
      case 'avail':
        return filesize(row[attr], { standard: "iec" });
      case 'used':
        return filesize(row[attr], { standard: "iec" }) + " (" + row['used_pct'] +
          ")";
      default:
        return row[attr];
    }
  }

  public titleRowValue(row, attr): any {
    let returnValue = row[attr];

    switch (attr) {
      case 'avail':
      case 'used':
        try {
          returnValue = filesize(row[attr], { standard: "iec" });
        } catch (error) {
          console.log("Error", error);
        }
        break;
      default:
        returnValue = row[attr];
    }

    return returnValue;
  }

  getAddActions() {
    const actions = [];
    actions.push({
      label: "Import Volumes",
      icon: "vertical_align_bottom",
      onClick: () => {
        this._router.navigate(new Array('/').concat(
          ["storage", "volumes", "import_list"]));
      }
    });
    return actions;
  }

  getActions(row) {
    const actions = [];
    //workaround to make deleting volumes work again,  was if (row.vol_fstype == "ZFS")
    if (row.type === 'zpool') {
      actions.push({
        label: "Extend",
        onClick: (row) => {
          this._router.navigate(new Array('/').concat(
            ["storage", "volumes", "manager", row.id]));
        }
      });
      actions.push({
        label: "Delete",
        onClick: (row) => {
          this._router.navigate(new Array('/').concat(
            ["storage", "volumes", "delete", row.id]));
        }
      });
      actions.push({
        label: "Status",
        onClick: (row) => {
          this._router.navigate(new Array('/').concat(
            ["storage", "volumes", "status", row.id]));
        }
      });

      if (row.vol_encrypt > 0) {
        actions.push({
          label: "Download Encrypt Key",
          onClick: (row) => {
            let dialogRef = this.mdDialog.open(DownloadKeyModalDialog, { disableClose: true });

            dialogRef.componentInstance.volumeId = row.id;
            dialogRef.afterClosed().subscribe(result => {
              this._router.navigate(['/', 'storage', 'volumes']);
            });
          }
        });
      }
    }

    if (row.type == "dataset") {
      actions.push({
        label: "Add Dataset",
        onClick: (row) => {
          this._router.navigate(new Array('/').concat([
            "storage", "volumes", "id", row.path.split('/')[0], "dataset",
            "add", row.path
          ]));
        }
      });
      actions.push({
        label: "Add Zvol",
        onClick: (row) => {
          this._router.navigate(new Array('/').concat([
            "storage", "volumes", "id", row.path.split('/')[0], "zvol", "add",
            row.path
          ]));
        }
      });
      actions.push({
        label: "Edit Options",
        onClick: (row) => {
          this._router.navigate(new Array('/').concat([
            "storage", "volumes", "id", row.path.split('/')[0], "dataset",
            "edit", row.path
          ]));
        }
      });
      if (row.path.indexOf('/') != -1) {
        actions.push({
          label: "Delete Dataset",
          onClick: (row) => {
            this._router.navigate(new Array('/').concat([
              "storage", "volumes", "id", row.path.split('/')[0], "dataset",
              "delete", row.path
            ]));
          }
        });
        actions.push({
          label: "Edit Permissions",
          onClick: (row) => {
            this._router.navigate(new Array('/').concat([
              "storage", "volumes", "id", row.path.split('/')[0], "dataset",
              "permissions", row.path
            ]));
          }
        });
      }
    }
    if (row.type == "zvol") {
      actions.push({
        label: "Delete Zvol",
        onClick: (row) => {
          this._router.navigate(new Array('/').concat([
            "storage", "volumes", "id", row.path.split('/')[0], "zvol",
            "delete", row.path
          ]));
        }
      });
      actions.push({
        label: "Edit Zvol",
        onClick: (row) => {
          this._router.navigate(new Array('/').concat([
            "storage", "volumes", "id", row.path.split('/')[0], "zvol", "edit",
            row.path
          ]));
        }
      });
    }
    return actions;
  }


  resourceTransformIncomingRestData(data: any): any {
    data = new EntityUtils().flattenData(data);
    const returnData: any[] = [];

    for (let i = 0; i < data.length; i++) {
      if (data[i].status !== '-') {
        data[i].type = 'zpool'
        data[i].path = data[i].name
      }
      if (data[i].type === 'dataset' && typeof (this.dataset_data) !== "undefined" && typeof (this.dataset_data.data) !== "undefined") {
        for (let k = 0; k < this.dataset_data.data.length; k++) {
          if (this.dataset_data.data[k].name === data[i].path) {
            data[i].compression = this.dataset_data.data[k].compression;
            data[i].readonly = this.dataset_data.data[k].readonly;
            data[i].dedup = this.dataset_data.data[k].dedup;
          }

        }
      }

      if (data[i].type !== 'zpool') {
        returnData.push(data[i]);
      }


    }

    return returnData;
  };
}


@Component({
  selector: 'app-volumes-list',
  styleUrls: ['./volumes-list.component.css'],
  templateUrl: './volumes-list.component.html'
})
export class VolumesListComponent extends EntityTableComponent implements OnInit, AfterViewInit {

  employees: Employee[];
  lookupData: any;

  title = "Volumes";
  zfsPoolRows: ZfsPoolData[] = [];
  conf = new VolumesListTableConfig(this.router, "", "Volumes", this.mdDialog);
  expanded = false;

  constructor(protected rest: RestService, protected router: Router, protected ws: WebSocketService,
    protected _eRef: ElementRef, protected dialog: DialogService, protected loader: AppLoaderService,
    protected mdDialog: MdDialog, protected employeeService: EmployeeService) {
    super(rest, router, ws, _eRef, dialog, loader);

    this.employees = employeeService.getEmployees();
    this.lookupData = {
      store: {
        type: "array",
        data: this.employees,
        group: "City"
      }

    };
  }

  cellPrepared(e) {
    if (e.column.command === "edit") {
      let addLink = e.cellElement.querySelector(".dx-link-add");

      if (addLink) {
        addLink.remove();
      }
    }
  }

  onclickAction($event, data) {
    alert('data=' + data.value);
    $event.preventDefault();
  }

  ngOnInit(): void {
    this.rest.get("storage/volume", {}).subscribe((res) => {
      res.data.forEach((volume) => {
        volume.volumesListTableConfig = new VolumesListTableConfig(this.router, volume.id, volume.name, this.mdDialog);
        volume.type = 'zpool';
        this.zfsPoolRows.push(volume);
      });

      if (this.zfsPoolRows.length === 1) {
        this.expanded = true;
      }
    });

  }

  ngAfterViewInit(): void {

  }

}
