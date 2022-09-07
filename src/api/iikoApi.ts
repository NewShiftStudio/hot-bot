import axios from 'axios';

import { AuthToken } from '../@types/dto/auth/authToken';
import { OrganizationsResponseDto } from '../@types/dto/organization/response';
import { CreateUserDto } from '../@types/dto/user/create.dto';
import { UpdateUserDto } from '../@types/dto/user/update.dto';
import dotenv from 'dotenv';
import { IikoUser } from '../@types/entities/IikoUser';
import { getUserCity } from '../helpers/getUserCity';
dotenv.config();

export class IikoApi {
  constructor(private MSKApiLogin: string, private SPBApiLogin: string) {}
  async getAuthToken(city: 'MSK' | 'SPB') {
    try {
      if (city === 'SPB') {
        const response = await axios.post(
          'https://api-ru.iiko.services/api/1/access_token',
          {
            apiLogin: this.SPBApiLogin,
          }
        );
        const authData = response.data as AuthToken;
        return authData.token;
      } else {
        const response = await axios.post(
          'https://api-ru.iiko.services/api/1/access_token',
          {
            apiLogin: this.MSKApiLogin,
          }
        );
        const authData = response.data as AuthToken;
        return authData.token;
      }
    } catch (error) {
      console.log(error);
      return;
    }
  }

  async getOrganizationId(city: 'MSK' | 'SPB') {
    const authToken = await this.getAuthToken(city);
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
        }
      );
      const data = response.data as OrganizationsResponseDto;
      return data.organizations[0].id;
    } catch (error) {
      console.log(error);
      return;
    }
  }

  async createUser(user: CreateUserDto): Promise<string | undefined> {
    const userCity = getUserCity(user.city);
    console.log(userCity);

    const authToken = await this.getAuthToken(userCity);
    if (!authToken) return;
    const organizationId = await this.getOrganizationId(userCity);
    console.log('organizationId :', organizationId);
    if (!organizationId) return;

    try {
      const response = await axios.post(
        'https://api-ru.iiko.services/api/1/loyalty/iiko/customer/create_or_update',
        { ...user, organizationId },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      const data = response.data as { id: string };
      return data.id;
    } catch (error) {
      console.log(error);
      return;
    }
  }

  async updateUser(user: UpdateUserDto): Promise<string | undefined> {
    const userCity = getUserCity(user.city);
    const authToken = await this.getAuthToken(userCity);
    if (!authToken) return;
    const organizationId = await this.getOrganizationId(userCity);
    if (!organizationId) return;

    try {
      const response = await axios.post(
        'https://api-ru.iiko.services/api/1/loyalty/iiko/customer/create_or_update',
        { ...user, organizationId },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      const data = response.data as { id: string };
      return data.id;
    } catch (error) {
      console.log(error);
      return;
    }
  }

  async getUserBalance(
    iikoId: string,
    city: string
  ): Promise<number | undefined> {
    const userCity = getUserCity(city);
    const authToken = await this.getAuthToken(userCity);
    if (!authToken) return;
    const organizationId = await this.getOrganizationId(userCity);
    if (!organizationId) return;

    try {
      const response = await axios.post(
        'https://api-ru.iiko.services/api/1/loyalty/iiko/customer/info',
        {
          id: iikoId,
          type: 'id',
          organizationId,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
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

export const iikoApi = new IikoApi(
  process.env.IIKO_API_LOGIN_MSK || '',
  process.env.IIKO_API_LOGIN_SPB || ''
);
