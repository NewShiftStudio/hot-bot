import { WalletBalance } from './WalletBalance';

export type IikoUser = {
  id: string;
  phone?: string;
  cardTrack?: string
  cardNumber?: string;
  name?: string;
  middleName?: string;
  surName?: string;
  birthday?: Date;
  email?: string;
  organizationId: string;
  referrerId: string;
  comment: string;
  sex: number;
  consentStatus: number;
  anonymized: boolean;
  walletBalances: WalletBalance[];
};
