import axios from 'axios';

import { AuthToken } from '../@types/dto/auth/authToken';
import { OrganizationsResponseDto } from '../@types/dto/organization/response';
import { CreateUserDto } from '../@types/dto/user/create.dto';
import { UpdateUserDto } from '../@types/dto/user/update.dto';
import dotenv from 'dotenv';
import { IikoUser } from '../@types/entities/IikoUser';
dotenv.config();

export class IikoApi {
  constructor(private apiLogin: string) {}
  async getAuthToken() {
    try {
      const response = await axios.post(
        'https://api-ru.iiko.services/api/1/access_token',
        {
          apiLogin: this.apiLogin,
        },
      );
      const authData = response.data as AuthToken;
      return authData.token;
    } catch (error) {
      console.log(error);
      return;
    }
  }

  async getOrganizationId() {
    const authToken = await this.getAuthToken();
    if (!authToken) return;

    try {
      const response = await axios.post(
        'https://api-ru.iiko.services/api/1/organizations',
        {
          returnAdditionalInfo: false,
          includeDisabled: false,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );
      const data = response.data as OrganizationsResponseDto;
      return data.organizations[0].id;
    } catch (error) {
      console.log(error);
      return;
    }
  }

  async createUser(user: CreateUserDto): Promise<string | undefined> {
    const authToken = await this.getAuthToken();
    if (!authToken) return;
    const organizationId = await this.getOrganizationId();
    if (!organizationId) return;

    try {
      const response = await axios.post(
        'https://api-ru.iiko.services/api/1/loyalty/iiko/customer/create_or_update',
        { ...user, organizationId },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );
      const data = response.data as { id: string };
      return data.id;
    } catch (error) {
      console.log(error);
      return;
    }
  }

  async updateUser(user: UpdateUserDto): Promise<string | undefined> {
    const authToken = await this.getAuthToken();
    if (!authToken) return;
    const organizationId = await this.getOrganizationId();
    if (!organizationId) return;

    try {
      const response = await axios.post(
        'https://api-ru.iiko.services/api/1/loyalty/iiko/customer/create_or_update',
        { ...user, organizationId },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );
      const data = response.data as { id: string };
      return data.id;
    } catch (error) {
      console.log(error);
      return;
    }
  }

  async getUserBalance(id: string): Promise<number | undefined> {
    const authToken = await this.getAuthToken();
    if (!authToken) return;
    const organizationId = await this.getOrganizationId();
    if (!organizationId) return;

    try {
      const response = await axios.post(
        'https://api-ru.iiko.services/api/1/loyalty/iiko/customer/info',
        {
          id,
          type: 'id',
          organizationId,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );
      const data = response.data as IikoUser;

      const wallet = data.walletBalances[0];
      if (!wallet) {
        return;
      }
      return wallet.balance;
    } catch (error) {
      console.log(error);
      return;
    }
  }
}

export const iikoApi = new IikoApi(process.env.IIKO_API_LOGIN || '');
