import statusCode from "http-status";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import {
  ICustomerCreateInput,
  IVendorCreateInput,
  IUserUpdateInput,
  RefreshTokenPayload,
} from "./auth.interface";
import jwt from "jsonwebtoken";
import AuthHelper from "./auth.helper";
import { SystemLevel } from "@prisma/client";
import { uploadToCloudinary } from "../../utils/uploadToCloudinary";
import ENV from "../../config/env";
import { JwtPayload } from "../../types";
import AuthRedis from "./auth.redis";
import { Cache } from "../../lib/cache";
import AuthKeys from "./auth.keys";

const register = async (
  payload: ICustomerCreateInput | IVendorCreateInput,
  avatarFile: Express.Multer.File | undefined,
  ip: string,
) => {
  const { name, email, password, avatar: profilePic } = payload;
  const [, isUserExist] = await Promise.all([
    AuthRedis.authLimit(ip, email, 4),
    AuthHelper.findUserByEmail(email),
  ]);
  if (isUserExist) {
    throw new AppError(statusCode.CONFLICT, "User already exists!");
  }
  // password hash promise
  const passHashPromise = AuthHelper.passwordHash(password);
  // file upload promise
  const uploadPromise =
    !profilePic && avatarFile
      ? uploadToCloudinary(avatarFile.buffer, "userAvatar")
      : Promise.resolve(null);

  const [hashedPassword, uploadResult] = await Promise.all([
    passHashPromise,
    uploadPromise,
  ]);

  let avatarUrl: string | undefined;
  let avatarId: string | undefined;

  if (profilePic) {
    avatarUrl = profilePic;
  } else if (uploadResult) {
    avatarUrl = uploadResult.url;
    avatarId = uploadResult.public_id;
  }

  const data = {
    ...payload,
    password: hashedPassword,
    avatar: avatarUrl,
    avatarId,
  };

  // otp generate
  const { otp, hashedOtp, otpExpiry } = AuthHelper.generateOtpData();
  Promise.all([
    Cache.set(AuthKeys.otp(email), hashedOtp, 300),
    Cache.set(AuthKeys.pendingUser(email), data, 3600),
    AuthHelper.sendAccountVerifyOTPEmail(email, otp).catch((err) => {
      console.error("Email send failed:", err);
    }),
  ]);

  return {
    name,
    email,
    otpExpiry,
  };
};

const resendOtpInDB = async (email: string) => {
  const [, pendingUser] = await Promise.all([
    AuthRedis.coolDownOtp(email),
    Cache.get(AuthKeys.pendingUser(email)),
  ]);
  if (!pendingUser) {
    throw new AppError(
      statusCode.NOT_FOUND,
      "User not found! Please register again.",
    );
  }

  const { otp, hashedOtp, otpExpiry } = AuthHelper.generateOtpData();
  Promise.all([
    Cache.set(AuthKeys.otp(email), hashedOtp, 300),
    AuthHelper.sendAccountVerifyOTPEmail(email, otp),
  ]);

  return {
    email,
    otpExpiry,
  };
};

const verifyUserOtpInDB = async (
  email: string,
  otp: string,
  ip: string,
  userAgent: string,
  level: SystemLevel,
) => {
  // await AuthHelper.validateOtp(email, otp);
  const key = AuthKeys.pendingUser(email);
  const [_, pendingUser] = await Promise.all([
    AuthHelper.validateOtp(email, otp),
    Cache.get<ICustomerCreateInput | IVendorCreateInput>(key),
  ]);

  if (!pendingUser)
    throw new AppError(
      statusCode.NOT_FOUND,
      "User not found! Please register first.",
    );

  const { name, phone, password, avatar, avatarId } = pendingUser;

  const { userId, roleId } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        phone,
        password,
        avatar,
        avatarId,
        isVerified: true,
      },
    });

    // vendor create (optional)
    let roleId: string | null = null;
    if (level === SystemLevel.VENDOR) {
      roleId = await Cache.get<string>("auth:roleId:VENDOR");
      if (!roleId) {
        const role = await tx.role.findFirst({
          where: { name: SystemLevel.VENDOR },
          select: { id: true },
        });
        roleId = role ? role.id : null;
        if (!roleId) {
          throw new AppError(statusCode.NOT_FOUND, "Vendor role not found!");
        }
      }

      await Promise.all([
        tx.vendor.create({
          data: {
            userId: user.id,
            roleId,
          },
        }),
        Cache.set("auth:roleId:VENDOR", roleId, 60 * 60 * 24 * 30),
      ]);
    }
    return { userId: user.id, roleId };
  });

  const { refreshToken, hashedRefreshToken } = AuthHelper.createRefreshToken(
    email,
    userId,
    roleId,
  );

  Promise.all([
    AuthHelper.createAuthSession(userId, hashedRefreshToken, ip, userAgent),
    Cache.del(key),
  ]);

  const data: any = { refreshToken };
  const accessTokenPayload: JwtPayload = {
    email,
    userId,
    systemLevel: level,
  };

  if (level === SystemLevel.VENDOR) {
    if (!roleId) {
      throw new AppError(statusCode.NOT_FOUND, "Vendor role not found!");
    }
    const permissions = await AuthHelper.getPermissionsByRoleId(userId, roleId);
    data.permissions = permissions;
    accessTokenPayload.permissions = permissions;
  }

  data.accessToken = AuthHelper.createAccessToken(accessTokenPayload);
  return data;
};

const loginUser = async (
  email: string,
  password: string,
  ip: string,
  userAgent: string,
  level: SystemLevel,
) => {
  const [_, user] = await Promise.all([
    AuthRedis.authLimit(ip, email, 10),
    prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        password: true,
        isVerified: true,

        admins: {
          select: { roleId: true },
        },

        vendors: {
          select: { roleId: true },
        },

        vendorStaff: {
          select: { roleId: true },
        },
      },
    }),
  ]);

  if (!user) {
    throw new AppError(statusCode.BAD_REQUEST, "Invalid credentials!");
  }

  const { id: userId, password: userPassword, isVerified } = user;

  if (!isVerified) {
    throw new AppError(
      statusCode.BAD_REQUEST,
      "Please verify your email first!",
    );
  }

  const isPassMatch = await bcrypt.compare(password, userPassword);
  if (!isPassMatch) {
    throw new AppError(statusCode.BAD_REQUEST, "Invalid credentials!");
  }

  let permissionsPromise;
  let roleId: string | null = null;
  if (level !== SystemLevel.CUSTOMER) {
    roleId = AuthHelper.getRoleId(user, level);
    if (!roleId) throw new AppError(statusCode.BAD_REQUEST, "Role not found!");
    permissionsPromise = AuthHelper.getPermissionsByRoleId(userId, roleId);
  }

  const { refreshToken, hashedRefreshToken } = AuthHelper.createRefreshToken(
    email,
    userId,
    roleId,
  );

  AuthHelper.createAuthSession(userId, hashedRefreshToken, ip, userAgent).catch(
    (err) => {
      console.error("Session creation failed", err);
    },
  );

  const data: any = { refreshToken };
  const accessTokenPayload: JwtPayload = {
    email,
    userId,
    systemLevel: level,
  };

  if (level !== SystemLevel.CUSTOMER) {
    const permissions = await permissionsPromise;
    data.permissions = permissions;
    accessTokenPayload.permissions = permissions;
  }

  data.accessToken = AuthHelper.createAccessToken(accessTokenPayload);
  return data;
};

const updateProfileInDB = async (userId: string, payload: IUserUpdateInput) => {
  const user = await prisma.user.update({
    where: {
      id: userId,
    },
    data: payload,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatar: true,
      status: true,
      isVerified: true,
    },
  });

  return user;
};

const forgotPasswordOtpInDB = async (email: string) => {
  await AuthHelper.findUserOrThrow(email);

  const { otp, hashedOtp, otpExpiry } = AuthHelper.generateOtpData();
  Promise.all([
    Cache.set(AuthKeys.otp(email), hashedOtp, 300),
    AuthHelper.sendResetPasswordOTPEmail(email, otp),
  ]);

  return otpExpiry;
};

const resetPasswordInDB = async (
  email: string,
  otp: string,
  newPassword: string,
) => {
  const [_, { id: userId }, hashedPassword] = await Promise.all([
    AuthHelper.validateOtp(email, otp),
    AuthHelper.findUserOrThrow(email),
    AuthHelper.passwordHash(newPassword),
  ]);

  await Promise.all([
    prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
      },
    }),
    prisma.session.deleteMany({ where: { userId } }),
    AuthRedis.removeSession(userId),
  ]);
};

const refreshAccessToken = async (
  incomingRefreshToken: string,
  level: SystemLevel,
) => {
  if (!incomingRefreshToken) {
    throw new AppError(
      statusCode.UNAUTHORIZED,
      "Unauthorized - No token provided!",
    );
  }

  const hashedRefreshToken = crypto
    .createHash("sha256")
    .update(incomingRefreshToken)
    .digest("hex");

  let decoded: RefreshTokenPayload;
  try {
    decoded = jwt.verify(
      incomingRefreshToken,
      ENV.REFRESH_TOKEN_SECRET,
    ) as RefreshTokenPayload;
  } catch (err) {
    throw new AppError(
      statusCode.UNAUTHORIZED,
      "Unauthorized - invalid or expired refresh token!",
    );
  }
  const { email, userId, roleId } = decoded;

  let permissionsPromise;
  if (level !== SystemLevel.CUSTOMER) {
    if (!roleId) throw new AppError(statusCode.FORBIDDEN, "Forbidden access!");
    permissionsPromise = AuthHelper.getPermissionsByRoleId(userId, roleId);
  }

  let session: any = await Cache.get(AuthKeys.authSession(hashedRefreshToken));
  if (!session) {
    const dbSession = await prisma.session.findUnique({
      where: { hashedRefreshToken },
    });
    if (dbSession && dbSession.expiresAt > new Date()) {
      AuthRedis.addSession(hashedRefreshToken, userId, session);
      session = dbSession;
    } else {
      session = null;
    }
  }
  if (!session) {
    throw new AppError(
      statusCode.UNAUTHORIZED,
      "Unauthorized - invalid refresh token!",
    );
  }

  const data: any = {};
  const accessTokenPayload: JwtPayload = {
    email,
    userId,
    systemLevel: level,
  };

  if (level !== SystemLevel.CUSTOMER) {
    const permissions = await permissionsPromise;
    data.permissions = permissions;
    accessTokenPayload.permissions = permissions;
  }

  data.accessToken = AuthHelper.createAccessToken(accessTokenPayload);
  return data;
};

const logoutUser = async (refreshToken: string) => {
  if (!refreshToken) {
    throw new AppError(
      statusCode.UNAUTHORIZED,
      "Unauthorized - refresh token not found",
    );
  }

  let decoded: RefreshTokenPayload;
  try {
    decoded = jwt.verify(
      refreshToken,
      ENV.REFRESH_TOKEN_SECRET,
    ) as RefreshTokenPayload;
  } catch (err) {
    throw new AppError(
      statusCode.UNAUTHORIZED,
      "Unauthorized - invalid or expired refresh token!",
    );
  }
  const { userId } = decoded;

  const hashedRefreshToken = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");
  const key = AuthKeys.authSession(hashedRefreshToken);
  Promise.all([
    prisma.session.delete({ where: { hashedRefreshToken } }),
    Cache.del(key),
    Cache.sRem(AuthKeys.sessionKeys(userId), key),
  ]);

  return;
};

const AuthService = {
  register,
  resendOtpInDB,
  verifyUserOtpInDB,
  loginUser,
  updateProfileInDB,
  forgotPasswordOtpInDB,
  resetPasswordInDB,
  refreshAccessToken,
  logoutUser,
};

export default AuthService;
