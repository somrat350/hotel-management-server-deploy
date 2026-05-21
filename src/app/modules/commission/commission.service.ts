import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import statusCode from "http-status";

const getCommission = async (hotelId: string) => {
  const result = await prisma.commission.findMany({
    where: { hotelId },
  });

  if (!result) {
    throw new AppError(statusCode.NOT_FOUND, "NO Commission data is available");
  }
  return result;
};

const getCommissionById = async (commissionId: string) => {
  console.log("this is from service file")
  const result = await prisma.commission.findMany({
    where: { id: commissionId },
  });

  if (!result) {
    throw new AppError(statusCode.NOT_FOUND, "NO Commission data is available");
  }
  return result;
};



const commissionService = {
  getCommission,
  getCommissionById,
};

export default commissionService;
