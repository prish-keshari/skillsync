import { agentRouter } from "~/server/api/routers/agent";
import { chatRouter } from "~/server/api/routers/chat";
import { transcribeRouter } from "~/server/api/routers/transcribe";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

export const appRouter = createTRPCRouter({
  agent: agentRouter,
  chat: chatRouter,
  transcribe: transcribeRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
