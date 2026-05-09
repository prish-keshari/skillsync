import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "~/server/db";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const { userId } = await auth();

  return {
    db,
    userId,
    ...opts,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  let user = await ctx.db.user.findUnique({
    where: { clerkId: ctx.userId },
  });



  if (!user) {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "No email found on Clerk user",
      });
    }

    user = await ctx.db.user.create({
      data: {
        clerkId: ctx.userId,
        email,
        credits: 100,
      },
    });
  }

  return next({
    ctx: {
      ...ctx,
      user,
    },
  });
});
