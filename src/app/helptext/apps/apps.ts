import { T } from '../../translate-marker';
import { Validators } from '@angular/forms';

export default {
  choosePool: {
    title: T('Choose a pool for Apps'),
    placeholder: T('Pools'),
    action: T('Confirm'),
    jobTitle: T('Configuring...'),
    success: T('Success'),
    message: T(' is now configured for apps.')
  },

  installing: T('Installing'),

  noPool: {
    title: T('No Pools Found'),
    message: T('At least one pool must be available to use apps'),
    action: T('Create Pool')
  }

}