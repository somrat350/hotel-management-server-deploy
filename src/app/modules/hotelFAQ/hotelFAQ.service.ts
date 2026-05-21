import { FAQStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";

// USER - Ask Question
const askQuestion = async (
  hotelId: string,
  userId: string,
  question: string,
) => {
  return prisma.hotelFAQ.create({
    data: {
      hotelId,
      userId,
      question,
    },
  });
};

const getHotelFAQ = async (hotelId: string, page: number, limit: number) => {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.hotelFAQ.findMany({
      where: {
        hotelId,
        status: { not: FAQStatus.HIDDEN },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.hotelFAQ.count({
      where: { hotelId, status: { not: FAQStatus.HIDDEN } },
    }),
  ]);

  return { data, total };
};

const getAllHotelFAQ = async (
  hotelId: string,
  status: FAQStatus | "all",
  page: number,
  limit: number,
) => {
  const query: { hotelId: string; status?: FAQStatus } = { hotelId };
  if (status && status !== "all") {
    query.status = status;
  }
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.hotelFAQ.findMany({
      where: query,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.hotelFAQ.count({
      where: query,
    }),
  ]);

  return { data, total };
};

const answerQuestion = async (faqId: string, answer: string) => {
  return prisma.hotelFAQ.update({
    where: { id: faqId },
    data: {
      answer,
      status: FAQStatus.ANSWERED,
    },
  });
};

const hideQuestion = async (faqId: string) => {
  return prisma.hotelFAQ.update({
    where: { id: faqId },
    data: {
      status: FAQStatus.HIDDEN,
    },
  });
};

const HotelFAQService = {
  askQuestion,
  getHotelFAQ,
  getAllHotelFAQ,
  answerQuestion,
  hideQuestion,
};
export default HotelFAQService;
