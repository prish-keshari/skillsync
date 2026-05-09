import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { groq } from "~/server/groq";
import { qdrant, COLLECTION_NAME } from "~/server/qdrant";
import { logger } from "~/server/logger";

const TOOL_DEFINITION = {
    type: "function" as const,
    function: {
        name: "search_knowledge_base",
        description:
            "Search the university knowledge base for specific information about courses, labs, exams, syllabi, passing criteria, schedules, or any academic data.",
        parameters: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "The search query to find relevant information",
                },
            },
            required: ["query"],
        },
    },
};

async function getEmbedding(text: string): Promise<number[]> {
    const response = await groq.embeddings.create({
        model: "nomic-embed-text-v1_5",
        input: text,
    });
    return response.data[0]!.embedding as number[];
}

async function searchKnowledgeBase(query: string): Promise<string> {
    logger.skill(`search_knowledge_base → "${query}"`);

    const queryEmbedding = await getEmbedding(query);
    logger.rag("Embedding generated, searching Qdrant...");

    const results = await qdrant.query(COLLECTION_NAME, {
        query: queryEmbedding,
        limit: 3,
        with_payload: true,
    });

    if (!results.points || results.points.length === 0) {
        logger.rag("No documents found");
        return "No relevant information found in the knowledge base.";
    }

    logger.rag(`Found ${results.points.length} documents`);

    const context = results.points
        .map((point, i) => {
            const payload = point.payload as Record<string, unknown>;
            return `[Document ${i + 1}]: ${payload.text ?? ""}`;
        })
        .join("\n\n");

    return context;
}

export const chatRouter = createTRPCRouter({
    sendMessage: protectedProcedure
        .input(
            z.object({
                agentId: z.string(),
                message: z.string().min(1),
                history: z.array(
                    z.object({
                        role: z.enum(["user", "assistant"]),
                        content: z.string(),
                    }),
                ),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            if (ctx.user.credits <= 0) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "No credits remaining. Please upgrade your plan.",
                });
            }

            const agent = await ctx.db.agent.findUnique({
                where: { id: input.agentId },
            });

            if (!agent) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
            }

            logger.groq("Thinking...");
            logger.credits(`User ${ctx.user.email} has ${ctx.user.credits} credits`);


            const messages: Array<{
                role: "system" | "user" | "assistant";
                content: string;
            }> = [
                    { role: "system", content: agent.systemPrompt },
                    ...input.history,
                    { role: "user", content: input.message },
                ];

            const firstResponse = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages,
                tools: [TOOL_DEFINITION],
                tool_choice: "auto",
                temperature: 0.7,
                max_tokens: 1024,
            });

            const firstChoice = firstResponse.choices[0]!;


            if (
                firstChoice.finish_reason === "tool_calls" &&
                firstChoice.message.tool_calls?.length
            ) {
                const toolCall = firstChoice.message.tool_calls[0]!;
                const args = JSON.parse(toolCall.function.arguments) as {
                    query: string;
                };

                logger.groq("Tool call detected — handing off to RAG pipeline");

                const context = await searchKnowledgeBase(args.query);


                logger.groq("Synthesizing final response with RAG context...");

                const finalResponse = await groq.chat.completions.create({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        ...messages,
                        firstChoice.message as { role: "assistant"; content: string | null },
                        {
                            role: "tool" as const,
                            tool_call_id: toolCall.id,
                            content: context,
                        } as unknown as { role: "assistant"; content: string },
                        {
                            role: "system",
                            content:
                                "Use the above knowledge base results to answer the user's question accurately. If the results don't contain relevant info, say so honestly.",
                        },
                    ],
                    temperature: 0.5,
                    max_tokens: 1024,
                });

                const reply = finalResponse.choices[0]?.message?.content ?? "No response generated.";

                await ctx.db.user.update({
                    where: { id: ctx.user.id },
                    data: { credits: { decrement: 1 } },
                });
                logger.credits(`Deducted 1 credit → ${ctx.user.credits - 1} remaining`);

                return { reply, usedRAG: true };
            }


            const reply = firstChoice.message?.content ?? "No response generated.";
            logger.groq("Direct response (no tool call)");

            await ctx.db.user.update({
                where: { id: ctx.user.id },
                data: { credits: { decrement: 1 } },
            });
            logger.credits(`Deducted 1 credit → ${ctx.user.credits - 1} remaining`);

            return { reply, usedRAG: false };
        }),
});
