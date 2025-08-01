import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextSystemSupport = {
  proactive: {
    title: T('Proactive Support'),
    instructions: T('Silver / Gold Coverage Customers can enable TrueNAS Proactive Support. This \
 automatically emails TrueNAS when certain conditions occur on this TrueNAS system. The TrueNAS Support \
 Team will promptly communicate with the Contacts saved below to quickly resolve any issue that may \
 have occurred on the system.'),
    primaryContact: T('Primary Contact'),

    secondaryContact: T('Secondary Contact'),

    dialogMessage: T('Successfully saved proactive support settings.'),
    dialogUnavailableTitle: T('Warning'),
    dialogUnavailableWarning: T('Proactive support settings is not available.'),
  },

  bug: {
    message: {
      label: T('Please describe:\n1. Steps to reproduce\n2. Expected Result\n3. Actual Result\n\nPlease use English for your report.'),
    },
  },

  review: {
    message: {
      placeholder: T('Share your thoughts on our product\'s features, usability, or any suggestions for improvement.'),
      placeholderHighRating: T('Any part of TrueNAS that you like in particular?'),
      placeholderLowRating: T('If something isn’t working correctly, it may be better to use the “Report a bug” option. This way you’ll automatically get status updates as we fix it.'),
    },
    voteForNewFeatures: T('You can also vote for new features <a target="_blank" href="https://forums.truenas.com/feature-requests">on our forum.</a>'),
  },

  token: {
    tooltip: T('OAuth Token for current session'),
  },

  type: {
    tooltip: T('Select <i>Bug</i> when reporting an issue or <i>Suggestion</i> when requesting new functionality.'),
  },

  name: {
    tooltip: T('Enter the name of the contact person.'),
  },

  email: {
    tooltip: T('Enter the email of the contact person. Use the format <i>name</i>@<i>domain.com</i>.'),
  },

  cc: {
    tooltip: T('Email addresses to receive copies of TrueNAS Support \
  messages about this issue. Use the format <i>name</i>@<i>domain.com</i>. \
  Separate entries by pressing <code>Enter</code>.'),
    err: T('Email addresses must be entered in the format \
  <i>local-name</i>@<i>domain.com<i>, with entries separated by pressing \
  <code>Enter</code>.'),
  },

  phone: {
    tooltip: T('Enter the phone number of the contact person.'),
  },

  attachDebug: {
    tooltip: T(
      'Set to generate and attach to the new issue a report\
 containing an overview of the system hardware, build\
 string, and configuration. This can take several\
 minutes.',
    ),
  },

  title: {
    placeholder: T('Enter a descriptive title for the new issue.'),
  },

  body: {
    tooltip: T(
      'Enter a one to three paragraph summary of the issue.\
 Describe the problem and provide any steps to\
 replicate the issue.',
    ),
  },

  screenshot: {
    tooltip: T('Select one or more screenshots that illustrate the problem.'),
  },

  updateLicense: {
    licensePlaceholder: T('License'),
    reloadDialogTitle: T('Reload the page'),
    reloadDialogMessage: T('Reload the page for the license to take effect.'),
    reloadDialogAction: T('Reload now'),
  },

  isProductionDialog: {
    message: T('Production status successfully updated'),
  },

  docHub: T('<a href="https://www.truenas.com/docs/hub/" target="_blank">\
 TrueNAS Documentation Hub</a> - Read and contribute to the open-source documentation.'),

  forums: T('<a href="https://forums.truenas.com/" target="_blank">\
 TrueNAS Forums</a> - Find answers from other users in the forums.'),

  licensing: T('<a href="https://www.ixsystems.com/support/truenas-arrays/" target="_blank">\
 TrueNAS Licensing</a> - Learn more about enterprise-grade support.'),

  updateTxt: T('Update License'),
  enterTxt: T('Add License'),
  ticket: T('File Ticket'),

  attachmentsFailed: {
    title: T('Attachments not uploaded'),
    message: T('Ticket was created, but we were unable to upload one or more attachments.'),
  },
};
