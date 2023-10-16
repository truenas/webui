import { Injectable } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';

// TODO: Load the columns and views from the backend.
export interface ViewConfigurationState {
  columns: unknown[];
}

@UntilDestroy()
@Injectable()
export class ViewConfigurationStore extends ComponentStore<ViewConfigurationState> {

}
