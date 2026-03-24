export interface CheckoutSessionParams {
  amount: number;
  currency: string;
  eventId: string;
  memberId: string;
  memberEmail: string;
  eventTitle: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

export interface PaymentVerification {
  status: "paid" | "pending" | "failed";
  amount: number;
  paymentRef: string;
}

export interface PaymentEvent {
  type: "payment.success" | "payment.failed" | "refund.created";
  sessionId: string;
  paymentRef: string;
  amount: number;
  metadata: Record<string, string>;
}

export interface PaymentProvider {
  createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSession>;
  verifyPayment(sessionId: string): Promise<PaymentVerification>;
  handleWebhook(payload: unknown, signature: string): Promise<PaymentEvent>;
}
