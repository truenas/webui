import {
  Component,
  OnInit,
  OnDestroy,
  QueryList,
  ViewChild,
  ViewChildren,
  AfterViewInit
} from '@angular/core';
import { Router } from '@angular/router';
import { DragulaService } from 'ng2-dragula';
import { Subscription } from 'rxjs';
import filesize from 'filesize';
import { RestService, WebSocketService, DialogService } from '../../../../services/';
import { DiskComponent } from './disk/';
import { VdevComponent } from './vdev/';
import { MdSnackBar, MdDialog, MdDialogRef } from '@angular/material';
import { DatatableComponent } from '@swimlane/ngx-datatable';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { DownloadKeyModalDialog } from '../../../../components/common/dialog/downloadkey/downloadkey-dialog.component';

@Component({
  selector: 'app-manager',
  templateUrl: 'manager.component.html',
  styleUrls: [
    'manager.component.css',
  ],
  providers: [
    RestService,
    DialogService
  ],
})
export class ManagerComponent implements OnInit, OnDestroy, AfterViewInit {

  public disks: Array < any > = [];
  public original_disks: Array < any > = [];
  public suggestable_disks: Array < any > = [];
  public can_suggest = false;
  public selected: Array < any > = [];
  public vdevs:
    any = { data: [{}], cache: [], spare: [], log: [] };
  public original_vdevs: any = {};
  public error: string;
  @ViewChild('disksdnd') disksdnd;
  @ViewChildren(VdevComponent) vdevComponents: QueryList < VdevComponent > ;
  @ViewChildren(DiskComponent) diskComponents: QueryList < DiskComponent > ;
  public originalVdevComponents: QueryList <VdevComponent>;
  public originalDiskComponents: QueryList <DiskComponent>;
  @ViewChild(DatatableComponent) table: DatatableComponent;
  public temp = [];
  
  public name: string;
  public vol_encrypt: number = 0;
  public isEncrypted: boolean = false;
  public re_errors = "";
  public re_has_errors = false;
  public nameFilter: RegExp;
  public capacityFilter: RegExp;
  public dirty = false;
  public layout_type = "redundancy";
  public layout_types = {"Redundancy":"redundancy", "Virtualization":"virtualization"}

  public busy: Subscription;

  constructor(
    private rest: RestService, 
    private ws: WebSocketService,
    private router: Router, 
    private dragulaService: DragulaService, 
    private dialog:DialogService, 
    public snackBar: MdSnackBar,
    private loader:AppLoaderService,
    public mdDialog: MdDialog ) {

    dragulaService.setOptions('pool-vdev', {
      accepts: (el, target, source, sibling) => { return true; },
    });
    dragulaService.drag.subscribe((value) => { console.log(value); });
    dragulaService.drop.subscribe((value) => {
      let [bucket, diskDom, destDom, srcDom, _] = value;
      let disk, srcVdev, destVdev;
      this.diskComponents.forEach((item) => {
        if (diskDom == item.elementRef.nativeElement) {
          disk = item;
        }
      });
      this.vdevComponents.forEach((item) => {
        if (destDom == item.dnd.nativeElement) {
          destVdev = item;
        } else if (srcDom == item.dnd.nativeElement) {
          srcVdev = item;
        }
      });
      if (srcVdev) {
        srcVdev.removeDisk(disk);
      }
      if (destVdev) {
        destVdev.addDisk(disk);
      }
    });
    dragulaService.over.subscribe((value) => { console.log(value); });
    dragulaService.out.subscribe((value) => { console.log(value); });
  }

  ngOnInit() {
    this.nameFilter = new RegExp('');
    this.capacityFilter = new RegExp('');
    this.ws.call("notifier.get_disks", [true]).subscribe((res) => {
      this.disks = [];
      for (let i in res) {
        res[i]['real_capacity'] = res[i]['capacity'];
        res[i]['capacity'] = filesize(res[i]['capacity'], {standard : "iec"});
        this.disks.push(res[i]);
      }
      this.original_disks = this.disks;

      // assign disks for suggested layout
      let largest_capacity = 0;
      for (let i = 0; i < this.disks.length; i++) {
        if (this.disks[i].real_capacity > largest_capacity) {
          largest_capacity = this.disks[i].real_capacity;
        }
      }
      for (let i = 0; i < this.disks.length; i++) {
        if (this.disks[i].real_capacity === largest_capacity) {
          this.suggestable_disks.push(this.disks[i]);
        }
      }
      this. can_suggest = this.suggestable_disks.length < 11;

      this.temp = [...this.disks];
    });
    this.original_vdevs = this.vdevs;
  }

  ngAfterViewInit() {
    this.originalVdevComponents = this.vdevComponents;
    this.originalDiskComponents = this.diskComponents;
  }

  ngOnDestroy() {
    this.dragulaService.destroy("pool-vdev");
  }

  addVdev(group) { this.vdevs[group].push({}); }

  removeVdev(vdev: VdevComponent) {
    let index = null;
    this.vdevComponents.forEach((item, i) => {
      if (item === vdev) {
        index = i;
      }
    });
    if (index !== null) {
      if (vdev.group === 'data') {
        this.vdevs[vdev.group].splice(index, 1);
      } else {
        this.vdevs[vdev.group] = []; // should only be one cache/spare/log
      }
    }
  }

  doSubmit() {
    this.dialog.confirm("Warning", "The existing contents of all the disks you have added will be erased.")
    .subscribe((res) => {
      if (res) {
        this.error = null;

        let layout = [];
        this.vdevComponents.forEach((vdev) => {
          let disks = [];
          vdev.getDisks().forEach((disk) => { 
            disks.push(disk.devname); });
          if (disks.length > 0) {
            layout.push({ vdevtype: vdev.type, disks: disks });
          }
        });

        this.loader.open();
        this.busy =
          this.rest
          .post('storage/volume/', {
            body: JSON.stringify({ volume_name: this.name, encryption: this.vol_encrypt, layout: layout })
          })
          .subscribe(
            (res) => {
              this.loader.close();
              if(this.isEncrypted) {
                let dialogRef = this.mdDialog.open(DownloadKeyModalDialog, {disableClose:true});

                dialogRef.componentInstance.volumeId = res.data.id;
                dialogRef.afterClosed().subscribe(result => {
                  this.router.navigate(['/', 'storage', 'volumes']);
                });
              }
              else {
                this.router.navigate(['/', 'storage', 'volumes']);
              }      
            },
            (res) => {
              this.loader.close();
              if (res.code == 409) {
                this.error = '';
                for (let i in res.error) {
                  res.error[i].forEach(
                    (error) => { this.error += error + '<br />'; });
                }
              }
            });
      }
    });
  }

  goBack() {
    this.router.navigate(['/', 'storage', 'volumes']);
  }

  openSnackBar() {
    this.snackBar.open("Always backup the key! If the key is lost, the data on the disks will also be lost with no hope of recovery.", "WARNING!", {
      duration: 5000,
    });
  }

  openDialog() {
    this.dialog.confirm("Warning", "Always backup the key! If the key is lost, the data on the disks will also be lost with no hope of recovery.").subscribe((res) => {
      if (res) {
        this.isEncrypted = true;
        this.vol_encrypt = 1
      } else {
        this.isEncrypted = false;
        this.vol_encrypt = 0;
      }
    });
  }

  isEncryptedChecked() {
    this.openDialog();
  }

  addDisk(disk: any) {
     this.disks.push(disk);
     this.temp.push(disk);
  }
  
  removeDisk(disk: any) {
    this.disks.splice(this.disks.indexOf(disk), 1);
    this.temp.splice(this.temp.indexOf(disk), 1);
    this.dirty = true;
  }

  onSelect({ selected }) {
    this.selected.splice(0, this.selected.length);
    this.selected.push(...selected);
  }

  updateFilter(event) {
    const val = event.target.value.toLowerCase();
    let temp = this.temp;
    let re;
    try {
      re = new RegExp(val);
    } catch(e) {
      this.re_errors = "Invalid regex filter";
      this.re_has_errors = true;
    }

    // filter our data
    if (re) {
      if (event.target.id === "nameFilter") {
        this.nameFilter = re;
      } else if (event.target.id === "capacityFilter") {
        this.capacityFilter = re;
      }

      this.re_has_errors = false;
      const self = this;
      const temp = this.temp.filter(function(d) {
        return self.nameFilter.test(d.devname.toLowerCase()) &&
               self.capacityFilter.test(d.capacity.toLowerCase());
      });

      // update the rows
      this.disks = temp;

      // Whenever the filter changes, always go back to the first page
      this.table.offset = 0;
    }
  }

  reset() {
    this.disks = this.original_disks;
    this.diskComponents = this.originalDiskComponents;
    this.selected = [];
    this.temp = [...this.disks];
    this.vdevs = this.original_vdevs;
    this.vdevComponents = this.originalVdevComponents;
    this.dirty = false;
  }

  addSuggestedDisksToVdev(disks) {
     for (let i = 0; i < disks.length; i++) {
       this.vdevComponents.last.addDisk(disks[i]);
     }
     while (disks.length > 0) {
        this.removeDisk(disks[0]);
        this.suggestable_disks.splice(this.suggestable_disks.indexOf(disks[0]), 1);
     }
  }

  suggestLayout() {
    this.reset();
    if (this.layout_type === "virtualization") {
      this.suggestVirtualizationLayout();
    } else {
      this.suggestRedundancyLayout();
    }

  }  

  suggestRedundancyLayout() {
    this.addSuggestedDisksToVdev(this.suggestable_disks);
  }

  suggestVirtualizationLayout() {
    let usable_length = this.suggestable_disks.length;
    if (usable_length % 2 !== 0) {
      usable_length = usable_length - 1;
    }
    for (let i, j = 0; i < usable_length; i += 2, j++) {
      this.addSuggestedDisksToVdev(this.suggestable_disks.slice(i-1,i));
    }
  }
}
