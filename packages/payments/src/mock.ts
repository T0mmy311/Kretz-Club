import type {
  PaymentProvider,
  CheckoutSessionParams,
  CheckoutSession,
  PaymentVerification,
  PaymentEvent,
} from "./interface";

export class MockPaymentProvider implements PaymentProvider {
  async createCheckoutSession(
    params: CheckoutSessionParams
  ): Promise<CheckoutSession> {
    const sessionId = `mock_session_${crypto.randomUUID()}`;
    console.log(`[MockPayment] Checkout session created: ${sessionId}`, {
      amount: params.amount,
      event: params.eventTitle,
    });

    return {
      sessionId,
      url: `${params.successUrl}?session_id=${sessionId}`,
    };
  }

  async verifyPayment(sessionId: string): Promise<PaymentVerification> {
    console.log(`[MockPayment] Verifying payment: ${sessionId}`);
    return {
      status: "paid",
      amount: 0,
      paymentRef: `mock_pay_${sessionId}`,
    };
  }

  async handleWebhook(
    _payload: unknown,
    _signature: string
  ): Promise<PaymentEvent> {
    return {
      type: "payment.success",
      sessionId: "mock_session",
      paymentRef: "mock_ref",
      amount: 0,
      metadata: {},
    };
  }
}
