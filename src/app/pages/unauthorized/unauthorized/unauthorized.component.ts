import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ix-unauthorized',
  templateUrl: './unauthorized.component.html',
  styleUrls: ['./unauthorized.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnauthorizedComponent { }
