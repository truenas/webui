import { User } from 'app/interfaces/user.interface';

export interface UserDataEvent {
  name: 'UserData';
  sender: unknown;
  data: User[];
}
