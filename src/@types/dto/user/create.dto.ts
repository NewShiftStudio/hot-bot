export enum ConsentStatus {
  UNKNOWN = 0,
  GIVEN = 1,
  REVOKED = 1,
}

export enum SEX {
  NOT_SPECIFIED = 0,
  MALE = 1,
  FEMALE = 1,
}

export type CreateUserDto = {
  name: string;
  city: string;
  phone?: string;
  surName?: string;
  birthday?: string; //yyyy-MM-dd HH:mm:ss.fff
  sex?: SEX;
  consentStatus?: ConsentStatus;
  cardTrack?: string;
  cardNumber?: string;
};
