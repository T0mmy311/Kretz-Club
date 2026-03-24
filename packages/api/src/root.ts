import { router } from "./trpc";
import { channelRouter } from "./routers/channel";
import { messageRouter } from "./routers/message";
import { conversationRouter } from "./routers/conversation";
import { memberRouter } from "./routers/member";
import { eventRouter } from "./routers/event";
import { investmentRouter } from "./routers/investment";
import { galleryRouter } from "./routers/gallery";
import { invoiceRouter } from "./routers/invoice";
import { recommendationRouter } from "./routers/recommendation";

export const appRouter = router({
  channel: channelRouter,
  message: messageRouter,
  conversation: conversationRouter,
  member: memberRouter,
  event: eventRouter,
  investment: investmentRouter,
  gallery: galleryRouter,
  invoice: invoiceRouter,
  recommendation: recommendationRouter,
});

export type AppRouter = typeof appRouter;
