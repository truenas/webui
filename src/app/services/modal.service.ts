import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ModalService {
    private modals: any[] = [];

    public refreshTable$ = new Subject();
    public refreshForm$ = new Subject();
    public getRow$ = new Subject();
    public message$ = new Subject();

    refreshTable() {
        this.refreshTable$.next();
    }

    refreshForm() {
        this.refreshForm$.next();
    }
    message(message: any) {
        this.message$.next(message)
    }

    add(modal: any) {
        // add modal to array of active modals
        this.modals.push(modal);
    }

    remove(id: string) {
        // remove modal from array of active modals
        this.modals = this.modals.filter(x => x.id !== id);
    }

    open(id: string, conf: any, rowid?: any) {
        if (rowid) {
            conf.rowid = rowid;
            this.getRow$.next(rowid);
        }
        // open modal specified by id
        let modal: any = this.modals.filter(x => x.id === id)[0];
        modal.open(conf);
    }

    close(id: string): Promise<boolean> {
        // close modal specified by id
        let modal: any = this.modals.filter(x => x.id === id)[0];
        return modal.close();
    }
}