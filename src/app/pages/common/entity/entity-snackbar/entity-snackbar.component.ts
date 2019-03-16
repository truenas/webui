import { Component } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';


@Component({
    selector: 'app-entity-snackbar',
    templateUrl: './entity-snackbar.component.html',
    styleUrls: ['./entity-snackbar.component.css']
})
export class EntitySnackbarComponent {
    public static message: string;
    public static action: string;

    public translatedMsg: string;
    public action: string;

    constructor(private snackbar: MatSnackBar,
        protected translate: TranslateService,
        public snackBarRef: MatSnackBarRef<EntitySnackbarComponent>) {
        this.translate.get(EntitySnackbarComponent.message).subscribe((res) => {
            this.translatedMsg = res;
        });
        this.action = EntitySnackbarComponent.action;
    }
}