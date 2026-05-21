import { Request, Response } from "express";
import statusCode from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import HotelFAQService from "./hotelFAQ.service";
import { FAQStatus } from "@prisma/client";
import ApiResponse from "../../utils/ApiResponse";

const askQuestion = catchAsync(async (req: Request, res: Response) => {
  const { hotelId } = req.params;
  const { userId } = req.user;
  const result = await HotelFAQService.askQuestion(
    hotelId as string,
    userId,
    req.body.question,
  );
  ApiResponse.success(
    res,
    result,
    "Question send successful.",
    statusCode.CREATED,
  );
});

const getHotelFAQ = catchAsync(async (req: Request, res: Response) => {
  const { hotelId } = req.params;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const { total, data } = await HotelFAQService.getHotelFAQ(
    hotelId as string,
    page,
    limit,
  );
  const totalPages = Math.ceil(total / limit);
  ApiResponse.paginated(
    res,
    data,
    { page, limit, total, totalPages },
    "FAQ get successful.",
  );
});

const getAllHotelFAQ = catchAsync(async (req: Request, res: Response) => {
  const { hotelId } = req.params;
  const status = req.query.page || "all";
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const { total, data } = await HotelFAQService.getAllHotelFAQ(
    hotelId as string,
    status as FAQStatus | "all",
    page,
    limit,
  );
  const totalPages = Math.ceil(total / limit);
  ApiResponse.paginated(
    res,
    data,
    { page, limit, total, totalPages },
    "FAQ get successful.",
  );
});

const answerQuestion = catchAsync(async (req: Request, res: Response) => {
  const data = await HotelFAQService.answerQuestion(
    req.params.faqId as string,
    req.body.answer,
  );
  ApiResponse.success(res, data, "Answer updated successful.");
});

const hideQuestion = catchAsync(async (req: Request, res: Response) => {
  const data = await HotelFAQService.hideQuestion(req.params.faqId as string);
  ApiResponse.success(res, data, "Question hide successful.");
});

const HotelFAQController = {
  askQuestion,
  getHotelFAQ,
  getAllHotelFAQ,
  answerQuestion,
  hideQuestion,
};
export default HotelFAQController;
