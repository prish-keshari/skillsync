import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { groq } from "~/server/groq";
import { logger } from "~/server/logger";

export const transcribeRouter = createTRPCRouter({
    transcribe: protectedProcedure
        .input(z.object({ audioBase64: z.string() }))
        .mutation(async ({ input }) => {
            logger.whisper("Received audio blob, transcribing...");

            const audioBuffer = Buffer.from(input.audioBase64, "base64");
            const file = new File([audioBuffer], "audio.webm", {
                type: "audio/webm",
            });

            const transcription = await groq.audio.transcriptions.create({
                file,
                model: "whisper-large-v3",
                response_format: "text",
            });

            const text =
                typeof transcription === "string"
                    ? transcription
                    : (transcription as { text: string }).text;

            logger.whisper(`Transcribed: "${text.slice(0, 80)}..."`);
            return { text };
        }),
});
