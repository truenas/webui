import { T } from '../../../translate-marker';
import { Validators } from '@angular/forms';
import { rangeValidator } from '../../../pages/common/entity/entity-form/validators/range-validation';

export default {
pending_changes_text : T('There are uncommited network changes. Commit them now?\
 Unsaved changes will be lost.'),
commit_changes_title: T("Commit Network Changes"),
commit_changes_warning: T("Commit network changes? Network connectivity will be interrupted."),
changes_saved_successfully: T("Network changes saved successfully."),
commit_button: T("Commit"),
rollback_button: T("Discard"),
rollback_changes_title: T("Discard Network Changes"),
rollback_changes_warning: T("Discard unsaved network changes?"),
changes_rolled_back: T("Network changes discarded."),

checkin_title: T("Network Changes Check-in"),
checkin_message: T("Network changes have been applied, check in now?  Settings will be automatically discarded if not checked in."),
checkin_complete_title: T("Network Check-in Complete"),
checkin_complete_message: T("Network changes checked in successfully."),
checkin_button: T('Check-in'),
}