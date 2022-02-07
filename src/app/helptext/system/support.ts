import { Validators } from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextSystemSupport = {
  proactive: {
    title: T('Proactive Support'),
    instructions: T('Silver / Gold Coverage Customers can enable iXsystems Proactive Support. This \
 automatically emails iXsystems when certain conditions occur on this TrueNAS system. The iX Support \
 Team will promptly communicate with the Contacts saved below to quickly resolve any issue that may \
 have occurred on the system.'),
    primary_contact: T('Primary Contact'),
    pc_name_placeholder: T('Name'),
    pc_title_placeholder: T('Title'),
    pc_email_placeholder: T('Email'),
    pc_phone_placeholder: T('Phone Number'),
    pc_validation: [Validators.required],
    pc_email_validation: [Validators.required, Validators.email],

    secondary_contact: T('Secondary Contact'),
    sec_name_placeholder: T('Name'),
    sec_title_placeholder: T('Title'),
    sec_email_placeholder: T('Email'),
    sec_phone_placeholder: T('Phone Number'),
    sec_email_validation: [Validators.required, Validators.email],

    enable_checkbox_placeholder: T('Enable iXsystems Proactive Support'),
    save_button: T('Save'),
    dialog_title: T('Settings saved'),
    dialog_mesage: T('Successfully saved proactive support settings.'),
    dialog_err: T('Error Saving Proactive Support Settings'),
    dialog_unavailable_title: T('Warning'),
    dialog_unavailable_warning: T('Proactive support settings is not available.'),
  },

  token: {
    placeholder: T('OAuth Token'),
    tooltip: T('OAuth Token for current session'),
    validation: [Validators.required],
  },

  type: {
    placeholder: T('Type'),
    tooltip: T(
      'Select <i>Bug</i> when reporting an issue or\
 <i>Feature</i> when requesting new functionality.',
    ),
  },

  name: {
    placeholder: T('Name'),
    tooltip: T('Enter the name of the contact person.'),
    validation: [Validators.required],
  },

  email: {
    placeholder: T('Email'),
    tooltip: T('Enter the email of the contact person. Use the format <i>name</i>@<i>domain.com</i>.'),
    validation: [Validators.required, Validators.email],
  },

  cc: {
    placeholder: T('CC'),
    tooltip: T('Email addresses to receive copies of iXsystems Support \
  messages about this issue. Use the format <i>name</i>@<i>domain.com</i>. \
  Separate entries by pressing <code>Enter</code>.'),
    err: T('Email addresses must be entered in the format \
  <i>local-name</i>@<i>domain.com<i>, with entries separated by pressing \
  <code>Enter</code>.'),
  },

  phone: {
    placeholder: T('Phone'),
    tooltip: T('Enter the phone number of the contact person.'),
    validation: [Validators.required],
  },

  category: {
    placeholder: T('Category'),
    tooltip: T(
      'This field remains empty until a valid\
 <b>Username</b> and <b>Password</b> is entered.\
 Choose the category that best describes the bug or\
 feature being reported.',
    ),
    validation: [Validators.required],
  },

  environment: {
    placeholder: T('Environment'),
    tooltip: T('Select the appropriate environment.'), // DRAFT TOOLTIP
    validation: [Validators.required],
  },

  criticality: {
    placeholder: T('Criticality'),
    tooltip: T('Select the appropriate level of criticality.'), // DRAFT TOOLTIP
    validation: [Validators.required],
  },

  attach_debug: {
    placeholder: T('Attach Debug'),
    tooltip: T(
      'Set to generate and attach to the new issue a report\
 containing an overview of the system hardware, build\
 string, and configuration. This can take several\
 minutes.',
    ),
  },

  title: {
    placeholder: T('Subject'),
    tooltip: T('Enter a descriptive title for the new issue.'),
    validation: [Validators.required],
  },

  body: {
    placeholder: T('Description'),
    tooltip: T(
      'Enter a one to three paragraph summary of the issue.\
 Describe the problem and provide any steps to\
 replicate the issue.',
    ),
    validation: [Validators.required],
  },

  screenshot: {
    placeholder: T('Attach screenshots.'),
    tooltip: T('Select one or more screenshots that illustrate the problem.'),
  },

  update_license: {
    open_dialog_button: T('Update License'),
    user_guide_button: T('User Guide'),
    eula_button: T('EULA'),
    dialog_title: T('Update License'),
    license_placeholder: T('License'),
    save_button: T('Save License'),
    reload_dialog_title: T('Reload the page'),
    reload_dialog_message: T('Reload the page for the license to take effect.'),
    reload_dialog_action: T('Reload now'),
    error_dialog_title: T('Error Unlocking'),
    snackbar_action: T('Close'),
  },

  core_upgrade_license: {
    dialog_title: T('Add or Update a License'),
    dialog_msg: T('To update the current software license or upgrade from TrueNAS Core® to TrueNAS \
 Enterprise®, copy the text of the TrueNAS license and paste it in this box.'),
  },

  is_production_checkbox: {
    placeholder: T('This is a production system'),
    tooltip: T('Set system production state and optionally send initial debug.'),
  },

  is_production_debug: {
    placeholder: T('Send initial debug'),
    tooltip: T('Send initial debug.'),
  },

  is_production_submit: T('Update Status'),

  is_production_error_dialog: {
    title: T('Error Updating Production Status'),
  },

  is_production_job: {
    title: T('Production Status'),
    message: T('Updating production status...'),
  },

  is_production_dialog: {
    title: T('Status updated'),
    message: T('Production status successfully updated'),
  },

  FN_instructions: T('Search the <a href="https://jira.ixsystems.com/projects/NAS/issues/" \
   target="_blank">TrueNAS issue tracker</a> \
   to ensure the issue has not already been reported before \
   filing a bug report or feature request. If an issue has \
   already been created, add a comment to the existing issue. \
   Please visit the <a href="http://www.ixsystems.com/storage/" target="_blank"> \
   iXsystems storage page</a> \
   for enterprise-grade storage solutions and support.'),

  FN_Jira_message: T('<a href="https://jira.ixsystems.com/secure/Signup!default.jspa" target="_blank" class="native-link">\
   Create a Jira account</a> to file an issue. Use a valid \
   email address when registering to receive issue status updates.'),

  submitBtn: T('Save'),

  contactUs: T('Contact Support'),

  docHub: T('<a href="https://www.truenas.com/docs/hub/" target="_blank">\
 TrueNAS Documentation Hub</a> - Read and contribute to the open-source documentation.'),

  forums: T('<a href="https://www.ixsystems.com/community/" target="_blank">\
 TrueNAS Forums</a> - Find answers from other users in the forums.'),

  licensing: T('<a href="https://www.ixsystems.com/support/" target="_blank">\
 TrueNAS Licensing</a> - Learn more about enterprise-grade support.'),

  updateTxt: T('Update License'),
  enterTxt: T('Add License'),
  ticket: T('File Ticket'),
  debugSizeLimitWarning: T('The ticket was created successfully (see link below), but the debug file\
   failed to attach. Please download the debug manually \
   (System → Advanced → Save Debug), upload it to a third-party storage service and provide\
    a link in the JIRA issue comment.'),

  updateProd: {
    title: T('Update Production Status'),
    message: T('Set production status as active'),
    checkbox: T('Send initial debug'),
    button: T('Proceed'),
  },

};
