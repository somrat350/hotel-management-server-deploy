import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { UserService } from "./user.service";
import ApiResponse from "../../utils/ApiResponse";

const updateUserProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const updatedUser = await UserService.updateUserPhoneAndName(
    req.body,
    userId,
  );

  ApiResponse.success(res, updatedUser, "User profile updated successfully");
});

const updateUserAvatar = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const avaratFile = req.file!;
  console.log(avaratFile);
  const updatedUser = await UserService.updateUserAvatar(avaratFile, userId);

  ApiResponse.success(res, updatedUser, "User avatar updated successfully");
});

export const UserController = {
  updateUserProfile,
  updateUserAvatar,
};
