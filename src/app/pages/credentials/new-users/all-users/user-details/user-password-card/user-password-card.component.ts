import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import {
  MatCard, MatCardTitle, MatCardHeader, MatCardContent,
} from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { User } from '@sentry/angular';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';

@Component({
  selector: 'ix-user-password-card',
  templateUrl: './user-password-card.component.html',
  styleUrls: ['./user-password-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardTitle,
    MatCardHeader,
    MatCardContent,
    TranslateModule,
    FormatDateTimePipe,
    YesNoPipe,
  ],
})
export class UserPasswordCardComponent {
  user = input.required<User>();
}
