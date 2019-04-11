import { T } from '../../../translate-marker';
import { Validators } from '@angular/forms';
import { rangeValidator } from '../../../pages/common/entity/entity-form/validators/range-validation';

export default {
pending_changes_text : T('You currently have pending network changes, do you wish to commit now?\
 Any changes that are not committed will be automatically rolled back.'),
commit_changes_title: T("Commit Network Changes"),
commit_changes_warning: T("Do you wish commit your network changes?  Network connectivity will be interrupted."),
changes_saved_successfully: T("Network changes saved successfully"),
commit_button: T("Commit"),
rollback_button: T("Rollback"),
rollback_changes_title: T("Rollback Network Changes"),
rollback_changes_warning: T("Do you wish rollback your network changes?"),
changes_rolled_back: T("Network changes rolled back"),
}