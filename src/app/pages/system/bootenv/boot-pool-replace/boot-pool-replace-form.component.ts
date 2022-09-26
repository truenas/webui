import {
  ChangeDetectionStrategy, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs/operators';
import { helptextSystemBootenv } from 'app/helptext/system/boot-env';
import { UnusedDisk } from 'app/interfaces/storage.interface';
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
  unusedDisks: UnusedDisk[] = [];

  form = this.fb.group({
    dev: ['', Validators.required],
  });

  dev = {
    fcName: 'dev',
    label: this.translate.instant(helptextSystemBootenv.replace_name_placeholder),
    options: this.ws.call('disk.get_unused').pipe(
      map((unusedDisks) => {
        this.unusedDisks = unusedDisks;
        const options = unusedDisks.map((disk) => ({
          label: disk.name + (disk.exported_zpool ? ' (' + disk.exported_zpool + ')' : ''),
          value: disk.name,
        }));

        return [
          ...options,
        ];
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

    this.setupWarningForExportedPools();
  }

  setupWarningForExportedPools(): void {
    this.form.get(this.dev.fcName).valueChanges.pipe(untilDestroyed(this)).subscribe(
      this.warnForExportedPools.bind(this),
    );
  }

  warnForExportedPools(disk: string): void {
    const unusedDisk = this.unusedDisks.find((unusedDisk) => unusedDisk.name === disk);
    if (!unusedDisk?.exported_zpool) {
      return;
    }
    this.dialogService.warn(
      this.translate.instant('Warning') + ': ' + unusedDisk.name,
      this.translate.instant(
        'This disk is part of the exported pool {pool}. Reusing this disk will make {pool} unable to import. You will lose any and all data in {pool}. Please make sure any sensitive data in {pool} is backed up before reusing/repurposing this disk.',
        { pool: `'${unusedDisk.exported_zpool}'` },
      ),
    );
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
