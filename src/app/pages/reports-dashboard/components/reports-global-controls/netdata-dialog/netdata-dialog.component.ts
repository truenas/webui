import { CdkScrollable } from '@angular/cdk/scrolling';
import {
  ChangeDetectionStrategy, Component, OnInit,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatDialogTitle, MatDialogClose, MatDialogContent } from '@angular/material/dialog';
import { FormControl } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ReportsService } from 'app/pages/reports-dashboard/reports.service';
import { AuthService } from 'app/services/auth/auth.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-netdata-dialog',
  styleUrls: ['./netdata-dialog.component.scss'],
  templateUrl: './netdata-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    MatIconButton,
    MatDialogClose,
    TestDirective,
    IxIconComponent,
    CdkScrollable,
    MatDialogContent,
    IxInputComponent,
    ReactiveFormsModule,
    FormActionsComponent,
    MatButton,
    TranslateModule,
  ],
})
export class NetdataDialogComponent implements OnInit {
  protected readonly usernameControl = new FormControl('');
  protected readonly passwordControl = new FormControl('');

  constructor(
    private ws: WebSocketService,
    private reportsService: ReportsService,
    private loader: AppLoaderService,
    private errorHandler: ErrorHandlerService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.generatePassword()
      .pipe(untilDestroyed(this))
      .subscribe((password) => {
        this.reportsService.openNetdata(password);
      });

    this.loadUsername();
  }

  protected onGeneratePasswordPressed(): void {
    this.generatePassword()
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  private loadUsername(): void {
    this.auth.user$
      .pipe(untilDestroyed(this))
      .subscribe((user) => {
        this.usernameControl.setValue(user.pw_name);
      });
  }

  private generatePassword(): Observable<string> {
    return this.ws.call('reporting.netdataweb_generate_password')
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        tap((password) => this.passwordControl.setValue(password)),
      );
  }
}
