import {
  ChangeDetectionStrategy, Component, OnInit,
} from '@angular/core';
import { FormControl } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
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
