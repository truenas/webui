import { T } from '../../translate-marker';
import { Validators } from '@angular/forms';

export default {
  choosePool: {
    title: T('Choose a pool for Apps'),
    placeholder: T('Pools'),
    action: T('Choose'),
    jobTitle: T('Configuring...'),
    success: T('Success'),
    message: T('Using pool ')
  },

  installing: T('Installing'),
  settings: T('Settings'),

  install: {
    title: T('Ready to Install'),
    msg1: T('Install '),
    msg2: T(' on pool ')
  },

  noPool: {
    title: T('No Pools Found'),
    message: T('At least one pool must be available to use apps'),
    action: T('Create Pool')
  }

}