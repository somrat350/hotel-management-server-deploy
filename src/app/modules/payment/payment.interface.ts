export interface PaymentInput {
  userId: string;
  productId: string;
  paymentType: string;

}

export interface PaymentOutput {
  paymentUrl: string;
  transId: string;
  paymentType: string;
}
