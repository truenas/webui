import {
  ChangeDetectionStrategy, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import filesize from 'filesize';
import { map } from 'rxjs/operators';
import { helptextSystemBootenv } from 'app/helptext/system/boot-env';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './boot-pool-replace-form.component.html',
  styleUrls: ['./boot-pool-replace-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BootPoolReplaceFormComponent implements OnInit {
  routeSuccess: string[] = ['system', 'boot', 'status'];
  pk: string;

  form = this.fb.group({
    dev: ['', Validators.required],
  });

  dev = {
    fcName: 'dev',
    label: this.translate.instant(helptextSystemBootenv.replace_name_placeholder),
    options: this.ws.call('disk.get_unused').pipe(
      map((disks) => {
        return disks.map((disk) => ({
          label: `${disk.name} (${filesize(disk.size, { standard: 'iec' })})`,
          value: disk.name,
        }));
      }),
    ),
  };

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private translate: TranslateService,
    private ws: WebSocketService,
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.pk = params['pk'];
    });
  }

  onSubmit(): void {
    const oldDisk = this.pk;
    const { dev: newDisk } = this.form.value;

    const dialogRef = this.dialog.open(EntityJobComponent, {
      data: {
        disableClose: true,
        title: this.translate.instant('Replacing Boot Pool Disk'),
      },
    });
    dialogRef.componentInstance.setCall('boot.replace', [oldDisk, newDisk]);
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      dialogRef.close();
      this.router.navigate(this.routeSuccess);
    });
  }

  cancel(): void {
    this.router.navigate(this.routeSuccess);
  }
}
