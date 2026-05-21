import { UserStatus } from "@prisma/client";

export interface IUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  avatar: string | undefined;
  status: UserStatus;
  isVerified: boolean;
}

export interface ICustomerCreateInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  avatar: string | undefined;
  avatarId: string | undefined;
}

export interface IVendorCreateInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  avatar: string | undefined;
  avatarId: string | undefined;
}

export interface IUserUpdateInput {
  name?: string;
  phone?: string;
  avatar?: string;
}

export interface RefreshTokenPayload {
  email: string;
  userId: string;
  roleId: string | null;
}

export interface AccessTokenPayload {
  email: string;
  userId: string;
  sessionId: string;
}
