import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ix-insecure-connection',
  templateUrl: './insecure-connection.component.html',
  styleUrls: ['./insecure-connection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InsecureConnectionComponent {
}
