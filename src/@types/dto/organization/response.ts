import { Organization } from '../../entities/Organization';

export type OrganizationsResponseDto = {
  correlationId: string;
  organizations: Organization[];
};
