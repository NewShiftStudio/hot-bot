import { ConsentStatus, SEX } from './create.dto';

export type UpdateUserDto = {
  id: string;
  name?: string;
  phone?: string;
  surName?: string;
  birthday?: string; //yyyy-MM-dd HH:mm:ss.fff
  email?: string;
  sex?: SEX;
  consentStatus?: ConsentStatus;
  cardTrack?: string;
  cardNumber?: string;
};
