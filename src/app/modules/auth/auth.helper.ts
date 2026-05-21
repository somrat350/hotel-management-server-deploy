import jwt from "jsonwebtoken";
import statusCode from "http-status";
import bcrypt from "bcrypt";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import { renderEmailTemplate } from "../../utils/renderEmailTemplate";
import ENV from "../../config/env";
import { SystemLevel } from "@prisma/client";
import { Cache } from "../../lib/cache";
import AuthKeys from "./auth.keys";
import AuthRedis from "./auth.redis";

const cryptoHashed = (value: string) => {
  return crypto.createHash("sha256").update(value).digest("hex");
};

const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      name: true,
      password: true,
      isVerified: true,
    },
  });
};

const createAuthSession = async (
  userId: string,
  hashedRefreshToken: string,
  ip: string,
  userAgent: string,
) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 15);
  const data = { userId, hashedRefreshToken, ip, userAgent, expiresAt };
  const session = await prisma.session.create({ data });
  await AuthRedis.addSession(hashedRefreshToken, userId, session);
  return session;
};

const findUserOrThrow = async (email: string) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new AppError(statusCode.NOT_FOUND, "User not found!");
  }
  return user;
};

const passwordHash = (password: string) => bcrypt.hash(password, 10);

const generateOtpData = () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = cryptoHashed(otp);
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
  return {
    otp,
    hashedOtp,
    otpExpiry,
  };
};

const createRefreshToken = (
  email: string,
  userId: string,
  roleId: string | null,
) => {
  const refreshToken = jwt.sign(
    { email, userId, roleId },
    ENV.REFRESH_TOKEN_SECRET as string,
    { expiresIn: "15d" },
  );
  const hashedRefreshToken = cryptoHashed(refreshToken);
  return { refreshToken, hashedRefreshToken };
};

const createAccessToken = (payload: object) => {
  return jwt.sign(payload, ENV.ACCESS_TOKEN_SECRET, {
    expiresIn: "24h",
  });
};

const validateOtp = async (email: string, providedOtp: string) => {
  const key = AuthKeys.otp(email);
  const hashedOtp: string | null = await Cache.get(key);
  if (!hashedOtp) {
    throw new AppError(statusCode.BAD_REQUEST, "OTP has expired!");
  }
  const hashedProvidedOtp = cryptoHashed(providedOtp);
  if (hashedOtp !== hashedProvidedOtp) {
    throw new AppError(statusCode.BAD_REQUEST, "Invalid OTP!");
  }
  await Cache.del(key);
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: ENV.EMAIL_USER,
    pass: ENV.EMAIL_PASS,
  },
});

const sendAccountVerifyOTPEmail = async (to: string, otp: string) => {
  try {
    const htmlTemplate = await renderEmailTemplate("accountVerifyOTP", {
      otp,
      expireMinutes: 5,
    });

    const mailOptions = {
      from: `"${ENV.EMAIL_FROM}" <${ENV.EMAIL_USER}>`,
      to,
      subject: "Account Verification OTP",
      html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending OTP email:", error);
  }
};

const sendResetPasswordOTPEmail = async (to: string, otp: string) => {
  try {
    const htmlTemplate = await renderEmailTemplate("resetPasswordOTP", {
      otp,
      expireMinutes: 5,
    });

    const mailOptions = {
      from: `"${ENV.EMAIL_FROM}" <${ENV.EMAIL_USER}>`,
      to,
      subject: "Password Reset OTP",
      html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending OTP email:", error);
  }
};

const getRoleId = (
  user: {
    admins: { roleId: string }[];
    vendors: { roleId: string }[];
    vendorStaff: { roleId: string } | null;
  },
  level: SystemLevel,
): string | null => {
  if (level === SystemLevel.CUSTOMER) return null;

  if (level === SystemLevel.ADMIN) {
    return user.admins[0]?.roleId ?? null;
  }

  if (level === SystemLevel.VENDOR) {
    // vendor owner priority
    if (user.vendors.length > 0) return user.vendors[0]?.roleId ?? null;

    // vendor staff fallback
    return user.vendorStaff?.roleId ?? null;
  }

  return null;
};

const getPermissionsByRoleId = async (
  userId: string,
  roleId: string,
): Promise<string[]> => {
  // Get cached permissions by user or role
  const userPermissionKey = AuthKeys.userPermission(userId);
  const rolePermissionKey = AuthKeys.rolePermission(roleId);
  const [userPermission, rolePermission] = await Promise.all([
    Cache.get<string[]>(userPermissionKey),
    Cache.get<string[]>(rolePermissionKey),
  ]);
  if (userPermission) return userPermission;
  if (rolePermission) return rolePermission;

  // Get role permissions + disabled permissions (parallel)
  const [rolePermissions, disabledPermissions] = await Promise.all([
    prisma.rolePermission.findMany({
      where: { roleId },
      select: {
        permission: {
          select: { name: true },
        },
      },
    }),

    prisma.disabledPermission.findMany({
      where: { userId, roleId },
      select: {
        permission: {
          select: { name: true },
        },
      },
    }),
  ]);

  // Convert to string arrays
  const rolePermissionNames = rolePermissions.map((rp) => rp.permission.name);

  const disabledNames = new Set(
    disabledPermissions.map((dp) => dp.permission.name),
  );

  // Remove disabled permissions
  const finalPermissions = rolePermissionNames.filter(
    (perm) => !disabledNames.has(perm),
  );

  // Cache user permission for 24h
  await Cache.set(userPermissionKey, finalPermissions, 60 * 60 * 24);

  return finalPermissions;
};

const AuthHelper = {
  cryptoHashed,
  createAuthSession,
  findUserByEmail,
  findUserOrThrow,
  passwordHash,
  generateOtpData,
  createRefreshToken,
  createAccessToken,
  validateOtp,
  sendAccountVerifyOTPEmail,
  sendResetPasswordOTPEmail,
  getRoleId,
  getPermissionsByRoleId,
};
export default AuthHelper;
