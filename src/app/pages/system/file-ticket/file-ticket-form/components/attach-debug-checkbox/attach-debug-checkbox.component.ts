import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { DialogService } from 'app/services/dialog.service';

@UntilDestroy()
@Component({
  selector: 'ix-attach-debug-checkbox',
  templateUrl: './attach-debug-checkbox.component.html',
  styleUrls: ['./attach-debug-checkbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttachDebugCheckboxComponent implements OnChanges {
  @Input() tooltip: string;
  @Input() isChecked: boolean;

  @Output() attachDebugAgreed = new EventEmitter<boolean>();

  constructor(
    private dialogService: DialogService,
    private translate: TranslateService,
  ) {}

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (changes.isChecked.currentValue) {
      this.showConfirmationDialog();
    }
  }

  showConfirmationDialog(): void {
    this.dialogService
      .confirm({
        title: this.translate.instant('Warning'),
        message: 'Debugs may contain log files with personal information such as usernames or other identifying information about your system. Debugs by default are attached privately to Jira tickets and only visible by iXsystem’s Engineering Staff. Please review debugs and redact any sensitive information before sharing with external entities. Debugs can be manually generated from System → Advanced → Save Debug',
        hideCheckbox: true,
        buttonText: this.translate.instant('Agree'),
      })
      .pipe(untilDestroyed(this))
      .subscribe((result) => {
        this.attachDebugAgreed.emit(result);
      });
  }

}
