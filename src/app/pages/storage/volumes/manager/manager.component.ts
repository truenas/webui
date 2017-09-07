import {
  Component,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import { Router } from '@angular/router';
import { DragulaService } from 'ng2-dragula';
import { Subscription } from 'rxjs';

import { RestService, WebSocketService, DialogService } from '../../../../services/';

import { DiskComponent } from './disk/';
import { VdevComponent } from './vdev/';
import { MdSnackBar } from '@angular/material';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';


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
export class ManagerComponent implements OnInit {

  public disks: Array < any > ;
  public vdevs:
    any = { data: [{}], cache: [{}], spare: [{}], log: [{}] };
  public error: string;
  @ViewChild('disksdnd') disksdnd;
  @ViewChildren(VdevComponent) vdevComponents: QueryList < VdevComponent > ;
  @ViewChildren(DiskComponent) diskComponents: QueryList < DiskComponent > ;

  public name: string;
  public vol_encrypt: number = 0;
  public isEncrypted: boolean = false;

  public busy: Subscription;

  constructor(private rest: RestService, private ws: WebSocketService,
    private router: Router, private dragulaService: DragulaService, 
    private dialog:DialogService, public snackBar: MdSnackBar,
    private loader:AppLoaderService) {
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
    this.ws.call("notifier.get_disks", [true]).subscribe((res) => {
      this.disks = [];
      for (let i in res) {
        this.disks.push(res[i]);
      }
    });
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
      vdev.getDisks().forEach((item) => {
        item.elementRef.nativeElement.parentNode.removeChild(
          item.elementRef.nativeElement);
        this.disksdnd.nativeElement.appendChild(item.elementRef.nativeElement);
      });
      this.vdevs[vdev.group].splice(index, 1);
    }
  }

  doSubmit() {
    this.error = null;

    let layout = [];
    this.vdevComponents.forEach((vdev) => {
      let disks = [];
      vdev.getDisks().forEach((disk) => { disks.push(disk.data.devname); });
      if (disks.length > 0) {
        layout.push({ vdevtype: vdev.type, disks: disks });
      }
    });

    this.loader.open();
    this.busy =
      this.rest
      .post('storage/volume/', {
        body: JSON.stringify({ volume_name: this.name, layout: layout })
      })
      .subscribe(
        (res) => {
          this.loader.close()
          this.router.navigate(['/', 'storage', 'volumes']);
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
}
