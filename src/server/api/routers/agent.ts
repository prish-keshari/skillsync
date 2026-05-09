import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const agentRouter = createTRPCRouter({
    
    getAll: protectedProcedure.query(async ({ ctx }) => {
        return ctx.db.agent.findMany({
            where: { ownerId: ctx.user.id },
            orderBy: { createdAt: "desc" },
        });
    }),

    
    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const agent = await ctx.db.agent.findUnique({
                where: { id: input.id },
                include: { owner: { select: { email: true } } },
            });

            if (!agent) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
            }

            if (!agent.isPublic && agent.ownerId !== ctx.user.id) {
                throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
            }

            return agent;
        }),

    
    create: protectedProcedure
        .input(
            z.object({
                name: z.string().min(1).max(100),
                systemPrompt: z.string().min(1).max(5000),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            return ctx.db.agent.create({
                data: {
                    name: input.name,
                    systemPrompt: input.systemPrompt,
                    ownerId: ctx.user.id,
                },
            });
        }),

    
    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const agent = await ctx.db.agent.findUnique({
                where: { id: input.id },
            });

            if (!agent || agent.ownerId !== ctx.user.id) {
                throw new TRPCError({ code: "FORBIDDEN", message: "Cannot delete this agent" });
            }

            return ctx.db.agent.delete({ where: { id: input.id } });
        }),

    
    getPublic: publicProcedure.query(async ({ ctx }) => {
        return ctx.db.agent.findMany({
            where: { isPublic: true },
            include: { owner: { select: { email: true } } },
            orderBy: { createdAt: "desc" },
        });
    }),

    
    getCredits: protectedProcedure.query(async ({ ctx }) => {
        return { credits: ctx.user.credits };
    }),
});
