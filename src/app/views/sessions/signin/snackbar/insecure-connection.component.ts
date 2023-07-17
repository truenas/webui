import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatSnackBarRef } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Component({
  templateUrl: './insecure-connection.component.html',
  styleUrls: ['./insecure-connection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InsecureConnectionComponent {
  constructor(
    private snackRef: MatSnackBarRef<InsecureConnectionComponent>,
    private router: Router,
  ) {}

  onConfigure(): void {
    this.router.navigate(['/system', 'general'], { fragment: 'gui' });
    this.snackRef.dismiss();
  }

  onClose(): void {
    this.snackRef.dismiss();
  }
}
