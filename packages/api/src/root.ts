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
import { reactionRouter } from "./routers/reaction";
import { mentionRouter } from "./routers/mention";
import { presenceRouter } from "./routers/presence";
import { readStatusRouter } from "./routers/readStatus";
import { adminRouter } from "./routers/admin";
import { invitationRouter } from "./routers/invitation";
import { pollRouter } from "./routers/poll";
import { attachmentRouter } from "./routers/attachment";
import { auditRouter } from "./routers/audit";
import { tagRouter } from "./routers/tag";
import { entraideRouter } from "./routers/entraide";
import { mentorshipRouter } from "./routers/mentorship";
import { resourceRouter } from "./routers/resource";
import { replayRouter } from "./routers/replay";

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
  reaction: reactionRouter,
  mention: mentionRouter,
  presence: presenceRouter,
  readStatus: readStatusRouter,
  admin: adminRouter,
  invitation: invitationRouter,
  poll: pollRouter,
  attachment: attachmentRouter,
  audit: auditRouter,
  tag: tagRouter,
  entraide: entraideRouter,
  mentorship: mentorshipRouter,
  resource: resourceRouter,
  replay: replayRouter,
});

export type AppRouter = typeof appRouter;
