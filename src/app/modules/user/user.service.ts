import { prisma } from "../../lib/prisma";
import { IUpdateUser, IUpdateUserAvatar } from "./user.validation";

const updateUserPhoneAndName = async (payload: IUpdateUser, userId: string) => {
  delete (payload as any).email;
  delete (payload as any).status;
  delete (payload as any).avatar;
  delete (payload as any).avatarId;

  console.log(payload);

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: payload,
  });

  return updatedUser;
};

const updateUserAvatar = async (file: Express.Multer.File, userId: string) => {
  const avatarUrl = file.path;
  console.log(avatarUrl);
  return;
  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      avatar: file.path,
    },
  });

  return updatedUser;
};

export const UserService = {
  updateUserPhoneAndName,
  updateUserAvatar,
};
