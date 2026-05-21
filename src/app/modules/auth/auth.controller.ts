import type { Request, Response } from "express";
import statusCode from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import AuthService from "./auth.service";
import { SystemLevel } from "@prisma/client";
import { validateImageFile } from "../../utils/validateImageFile";
import ENV from "../../config/env";
import ApiResponse from "../../utils/ApiResponse";

const register = (level: SystemLevel = SystemLevel.CUSTOMER) => {
  return catchAsync(async (req: Request, res: Response) => {
    const ip = req.ip;
    const file = validateImageFile(req, 2);
    const result = await AuthService.register(req.body, file, ip!);
    ApiResponse.success(
      res,
      result,
      "User created successfully. We send a otp to verify your email. Please check your email.",
      statusCode.CREATED,
    );
  });
};

const resendAccountVerifyOtp = catchAsync(
  async (req: Request, res: Response) => {
    const { email } = req.body;
    const result = await AuthService.resendOtpInDB(email);
    ApiResponse.success(
      res,
      result,
      "We have sent you an OTP to verify your account. Please check your email.",
    );
  },
);

const verifyOtp = (level: SystemLevel = SystemLevel.CUSTOMER) => {
  return catchAsync(async (req: Request, res: Response) => {
    const { email, otp } = req.body;
    const ip = req.ip;
    const userAgent = req.headers["user-agent"];
    const { refreshToken, accessToken, permissions } =
      await AuthService.verifyUserOtpInDB(email, otp, ip!, userAgent!, level);

    const isProduction = ENV.NODE_ENV === "production";
    res
      .status(statusCode.OK)
      .cookie("refreshToken", refreshToken, {
        path: "/",
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax", // strict for same site & none for different site
        maxAge: 15 * 24 * 60 * 60 * 1000, // 7 days
        secure: isProduction,
      })
      .cookie("accessToken", accessToken, {
        path: "/",
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax", // strict for same site & none for different site
        maxAge: 1 * 24 * 60 * 60 * 1000, // 1 days
        secure: isProduction,
      })
      .json({
        success: true,
        message: "Email verified successful! You are now logged in.",
        data: { accessToken, permissions },
      });
  });
};

const login = (level: SystemLevel = SystemLevel.CUSTOMER) => {
  return catchAsync(async (req: Request, res: Response) => {
    const ip = req.ip;
    const userAgent = req.headers["user-agent"];
    const { email, password } = req.body;
    const { refreshToken, accessToken, permissions } =
      await AuthService.loginUser(email, password, ip!, userAgent!, level);

    const isProduction = ENV.NODE_ENV === "production";
    res
      .status(statusCode.OK)
      .cookie("refreshToken", refreshToken, {
        path: "/",
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 15 * 24 * 60 * 60 * 1000, // 7d
        secure: isProduction,
      })
      .cookie("accessToken", accessToken, {
        path: "/",
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax", // strict for same site & none for different site
        maxAge: 1 * 24 * 60 * 60 * 1000, // 1 days
        secure: isProduction,
      })
      .json({
        success: true,
        message: "Login successful.",
        data: { accessToken, permissions },
      });
  });
};

const logout = catchAsync(async (req: Request, res: Response) => {
  const isProduction = ENV.NODE_ENV === "production";
  const refreshToken = req.cookies.refreshToken;
  await AuthService.logoutUser(refreshToken);
  res
    .status(statusCode.OK)
    .clearCookie("refreshToken", {
      path: "/",
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax", // strict for same site & none for different site
      maxAge: 0, // 0 days
      secure: isProduction,
    })
    .clearCookie("accessToken", {
      path: "/",
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax", // strict for same site & none for different site
      maxAge: 0, // 0 days
      secure: isProduction,
    })
    .json({ success: true, message: "Logged out successful." });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const user = await AuthService.updateProfileInDB(userId!, req.body);
  ApiResponse.success(res, user, "User profile updated successful.");
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const otpExpiry = await AuthService.forgotPasswordOtpInDB(email);
  ApiResponse.success(
    res,
    { otpExpiry },
    "We have sent you an OTP to reset your password. Please check your email.",
  );
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;
  const result = await AuthService.resetPasswordInDB(email, otp, newPassword);
  ApiResponse.success(
    res,
    result,
    "Password reset successful. Please login with your new password.",
  );
});

const refreshAccessToken = (level: SystemLevel = SystemLevel.CUSTOMER) => {
  return catchAsync(async (req: Request, res: Response) => {
    const incomingRefreshToken = req.cookies.refreshToken;
    const { accessToken, permissions } = await AuthService.refreshAccessToken(
      incomingRefreshToken,
      level,
    );

    const isProduction = ENV.NODE_ENV === "production";
    res
      .status(statusCode.OK)
      .cookie("accessToken", accessToken, {
        path: "/",
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax", // strict for same site & none for different site
        maxAge: 1 * 24 * 60 * 60 * 1000, // 1 days
        secure: isProduction,
      })
      .json({
        success: true,
        message: "Token refresh successful.",
        data: { accessToken, permissions },
      });
  });
};

const AuthController = {
  register,
  resendAccountVerifyOtp,
  verifyOtp,
  login,
  logout,
  updateProfile,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
};

export default AuthController;
