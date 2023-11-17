import { createAction, props } from '@ngrx/store';
import { FromWizardToAdvancedSubmitted } from 'app/enums/from-wizard-to-advanced.enum';

export const adminUiInitialized = createAction('[Admin UI] Initialized');

// when we switch from Wizard to Advanced Form or vice versa we loose ref which helps to refetch data
export const fromWizardToAdvancedFormSubmitted = createAction(
  '[Admin UI] From Wizard to Advanced Form and vice versa submitted',
  props<{ formType: FromWizardToAdvancedSubmitted }>(),
);

