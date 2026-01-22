import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogClose, MatDialogContent,
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TestDirective } from 'app/modules/test-id/test.directive';

export interface DiskErrorItem {
  guid: string;
  name: string;
  errorCount: {
    read: number;
    write: number;
    checksum: number;
  };
}

export interface DiskErrorsDialogData {
  poolId: number;
  poolName: string;
  disks: DiskErrorItem[];
}

@Component({
  selector: 'ix-disk-errors-dialog',
  templateUrl: './disk-errors-dialog.component.html',
  styleUrls: ['./disk-errors-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatButton,
    TestDirective,
    MatDialogClose,
    TranslateModule,
  ],
})
export class DiskErrorsDialogComponent {
  private dialogRef = inject<MatDialogRef<DiskErrorsDialogComponent>>(MatDialogRef);
  private router = inject(Router);
  private translate = inject(TranslateService);

  protected data = inject<DiskErrorsDialogData>(MAT_DIALOG_DATA);

  /**
   * used in the HTML template - given a disk, navigates to it in the VDEVs view.
   * @param disk disk error item to navigate to in the VDEVs page
   */
  protected onNavigateToDisk(disk: DiskErrorItem): void {
    const navPath = ['/storage', this.data.poolId.toString(), 'vdevs', disk.guid];
    this.router.navigate(navPath);
    this.dialogRef.close();
  }

  /**
   * used in the HTML template - produces a translated string to display the error counts.
   * @param disk disk error item to generate the string for
   * @returns translated string
   */
  protected getErrorText(disk: DiskErrorItem): string {
    return this.translate.instant(
      'Read errors: {rCount}, write errors: {wCount}, checksum errors: {cCount}',
      {
        rCount: disk.errorCount.read,
        wCount: disk.errorCount.write,
        cCount: disk.errorCount.checksum,
      },
    );
  }
}
