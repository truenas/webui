import { Injectable } from '@angular/core';
import { FormControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { filter, pairwise, startWith, switchMap } from 'rxjs/operators';
import { DialogService } from 'app/services/dialog.service';

@Injectable()
export class AttachDebugWarningService {

  constructor(private dialogService: DialogService, private translate: TranslateService) { }

  handleAttachDebugChanges(control: FormControl): Observable<boolean> {
    return control.valueChanges.pipe(
      startWith(null),
      pairwise(),
      filter(([previousValue, currentValue]) => !previousValue && currentValue),
      switchMap(() => this.showConfirmationDialog()),
    );
  }

  showConfirmationDialog(): Observable<boolean> {
    return this.dialogService
      .confirm({
        title: this.translate.instant('Warning'),
        message: 'Debugs may contain log files with personal information such as usernames or other identifying information about your system. Debugs by default are attached privately to Jira tickets and only visible by iXsystem’s Engineering Staff. Please review debugs and redact any sensitive information before sharing with external entities. Debugs can be manually generated from System → Advanced → Save Debug',
        hideCheckBox: true,
        buttonMsg: this.translate.instant('Agree'),
      });
  }
}
