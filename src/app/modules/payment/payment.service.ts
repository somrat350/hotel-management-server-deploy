import { SslCommerzPayment } from "sslcommerz";
import { prisma } from "../../lib/prisma.js";
import { PaymentInput, PaymentOutput } from "./payment.interface.js";
import { randomUUID } from "crypto";
import AppError from "../../utils/AppError.js";
import statusCode from "http-status";
import ENV from "../../config/env.js";
import { Request } from "express";

const initializePayment = async (
  paymentInput: PaymentInput,
): Promise<PaymentOutput> => {
  // TODO: Implement payment initialization logic
  const { userId, productId, paymentType } = paymentInput;
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new AppError(statusCode.NOT_FOUND, "User not found");
  }
  const product = await (prisma as any)[paymentType].findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new AppError(statusCode.NOT_FOUND, `${paymentType} is not found`);
  }

  if (product.status !== "PENDING") {
    throw new AppError(
      statusCode.BAD_REQUEST,
      `Already Paid or Invalid ${paymentType} status for payment`,
    );
  }

  const transId = `trans_${randomUUID()}`;
  const result = await prisma.payment.create({
    data: {
      userId,
      amount: paymentType == "booking" ? product.totalPrice : product.amount,
      paymentType,
      currency: "BDT",
      status: "PENDING",
    },
  });
  const sslData = {
    total_amount:
      paymentType == "booking" ? product.totalPrice : product.amount,
    currency: "BDT",
    tran_id: transId,

    success_url: `${ENV.BASE_URL}/api/v1/payments/success/${transId}/${productId}/${paymentType}/${result.id}`,
    fail_url: `${ENV.BASE_URL}/api/v1/payments/failure/${transId}/${productId}/${paymentType}/${result.id}`,
    cancel_url: `${ENV.BASE_URL}/api/v1/payments/cancel/${transId}/${productId}/${paymentType}/${result.id}`,

    product_name: "Hotel Booking",
    product_category: "Service",
    product_profile: "general",
    shipping_method: "NO",
    cus_name: user.name,
    cus_email: user.email,
    cus_add1: "Dhaka",
    cus_city: "Dhaka",
    cus_country: "Bangladesh",
  };

  const sslcz = new SslCommerzPayment(
    ENV.STORE_ID as string,
    ENV.STORE_PASSWORD as string,
    false, // true for live
  );

  const response = await sslcz.init(sslData);
  if (!response || !response.GatewayPageURL) {
    throw new Error("Failed to initialize payment");
  }

  return {
    paymentUrl: response.GatewayPageURL,
    transId,
  } as PaymentOutput;
};

const paymentSuccess = async (
  transId: string,
  paymentId: string,
  paymentType: string,
  productId: string,
) => {
  console.log("this is payment Id ; ", paymentId);
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });
  console.log("this is payment ; ", payment);
  if (!payment) {
    throw new AppError(statusCode.NOT_FOUND, "Payment record not found");
  }

  if (payment.status !== "PENDING") {
    throw new AppError(
      statusCode.BAD_REQUEST,
      "Payment is not in a valid state for success handling",
    );
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "SUCCESS", updatedAt: new Date() },
  });

  await (prisma as any)[paymentType].update({
    where: { id: productId },
    data: { status: "CONFIRMED", updatedAt: new Date() },
  });

  if (paymentType == "booking") {
    await prisma.bookingPayment.create({
      data: {
        transId,
        paymentId,
        productId,
      },
    });
    const booking = await prisma.booking.findUnique({
      where: {
        id: productId,
      },
    });
    if (!booking) {
      throw new AppError(statusCode.NOT_FOUND, "booking is not available");
    }
    const amount = booking?.totalPrice * 0.2;
    await prisma.commission.create({
      data: {
        amount,
        hotelId: booking?.hotelId,
        bookingId: booking?.id,
      },
    });
  } else {
    await prisma.commissionPayment.create({
      data: {
        transId,
        paymentId,
        productId,
      },
    });
  }

  return true;
};

const paymentFailOrCancel = async (
  transId: string,
  paymentType: string,
  paymentId: string,
  productId: string,
) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    throw new AppError(statusCode.NOT_FOUND, "Payment record not found");
  }

  if (payment.status !== "PENDING") {
    throw new AppError(
      statusCode.BAD_REQUEST,
      "Payment is not in a valid state for failure/cancel handling",
    );
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "FAILED", updatedAt: new Date() },
  });

  await (prisma as any)[paymentType].update({
    where: { id: productId },
    data: { status: "CANCELLED" },
  });

  return true;
};

const getPayment = async (userId: string) => {
  const result = await prisma.payment.findMany({
    where: {
      userId: userId,
    },
  });

  if (!result) {
    throw new AppError(
      statusCode.NOT_FOUND,
      "NO Payment History is available!",
    );
  }

  return result;
};

const getPaymentByType = async (userId: string, paymentType: string) => {
  const result = await prisma.payment.findMany({
    where: {
      userId,
      paymentType,
    },
  });

  if (!result) {
    throw new AppError(statusCode.NOT_FOUND, "Nothing is found!");
  }

  return result;
};

const getPaymentById = async (paymentId: string, paymentType: string) => {
  console.log("payment Id : ", paymentId, " ", "paymentType: ", paymentType);
  if (paymentType == "booking") {
    const result = await prisma.bookingPayment.findMany({
      where: {
        paymentId: paymentId,
      },
    });

    if (!result) {
      throw new AppError(statusCode.NOT_FOUND, "Nothing Found");
    }

    return result;
  } else {
    const result = await prisma.commissionPayment.findMany({
      where: {
        paymentId,
      },
    });
    if (!result) {
      throw new AppError(statusCode.NOT_FOUND, "Nothing Found");
    }

    return result;
  }
};

const paymentService = {
  initializePayment,
  paymentSuccess,
  paymentFailOrCancel,
  getPayment,
  getPaymentById,
  getPaymentByType,
};

export default paymentService;
