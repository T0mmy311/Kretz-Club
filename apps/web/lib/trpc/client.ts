import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@kretz/api";

export const trpc = createTRPCReact<AppRouter>();
