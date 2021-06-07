import { User } from 'app/interfaces/user.interface';

export interface UserDataEvent {
  name: 'UpdateChecked';
  sender: unknown;
  data: User[];
}
