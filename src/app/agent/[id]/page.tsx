"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { Navbar } from "~/app/_components/Navbar";
import { useVoice } from "~/app/_hooks/useVoice";

type Message = { role: "user" | "assistant"; content: string; usedRAG?: boolean };

export default function AgentRoomPage() {
    const { id } = useParams<{ id: string }>();
    const { data: agent, isLoading } = api.agent.getById.useQuery({ id });

    const [messages, setMessages] = useState<Message[]>([]);
    const [textInput, setTextInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    const { state: voiceState, setState: setVoiceState, startRecording, stopRecording, speak } = useVoice();

    const chatMutation = api.chat.sendMessage.useMutation();
    const utils = api.useUtils();

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [messages]);

    async function sendMessage(text: string) {
        if (!text.trim() || !agent) return;

        const userMsg: Message = { role: "user", content: text };
        setMessages((prev) => [...prev, userMsg]);
        setTextInput("");
        setVoiceState("thinking");

        try {
            const result = await chatMutation.mutateAsync({
                agentId: agent.id,
                message: text,
                history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
            });

            const assistantMsg: Message = { role: "assistant", content: result.reply, usedRAG: result.usedRAG };
            setMessages((prev) => [...prev, assistantMsg]);

            speak(result.reply);
            void utils.agent.getCredits.invalidate();
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Something went wrong";
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: `ERR_SYS: ${errorMsg}` },
            ]);
            setVoiceState("idle");
        }
    }

    async function handleMicClick() {
        if (voiceState === "recording") {
            try {
                const text = await stopRecording();
                if (text.trim()) await sendMessage(text);
            } catch {
                setVoiceState("idle");
            }
        } else if (voiceState === "idle") {
            await startRecording();
        }
    }

    function handleTextSubmit(e: React.FormEvent) {
        e.preventDefault();
        void sendMessage(textInput);
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a]">
                <Navbar />
                <div className="flex h-[80vh] items-center justify-center mono-label text-zinc-500">
                    <span className="status-dot inline-block h-2 w-2 bg-white mr-2" />
                    ESTABLISHING CONNECTION...
                </div>
            </div>
        );
    }

    if (!agent) {
        return (
            <div className="min-h-screen bg-[#0a0a0a]">
                <Navbar />
                <div className="flex h-[80vh] items-center justify-center font-mono text-red-500">
                    ERR 404: NODE_NOT_FOUND
                </div>
            </div>
        );
    }

    const statusConfig = {
        idle: { label: "AWAITING_INPUT", code: "IDLE" },
        recording: { label: "AUDIO_BUFFER_ACTIVE", code: "REC" },
        transcribing: { label: "WHISPER_STT_ACTIVE", code: "PROC" },
        thinking: { label: "LLM_INFERENCE_ACTIVE", code: "PROC" },
        speaking: { label: "AUDIO_OUT_ACTIVE", code: "OUT" },
    }[voiceState];

    return (
        <div className="flex h-screen flex-col bg-[#0a0a0a]">
            <Navbar />


            <header className="border-b border-zinc-800 bg-[#111] px-6 py-3 shrink-0">
                <div className="mx-auto flex max-w-4xl items-center justify-between">
                    <div className="flex flex-col">
                        <span className="mono-label text-zinc-500">CONNECTED_NODE</span>
                        <span className="font-bold tracking-tight text-white">{agent.name}</span>
                    </div>

                    <div className="flex items-center gap-4 border border-zinc-800 bg-[#0a0a0a] px-3 py-1.5 mono-label">
                        <span className="text-zinc-500">STATUS:</span>
                        <span className={`flex items-center gap-2 ${voiceState === 'idle' ? 'text-zinc-300' : 'text-white'}`}>
                            {voiceState !== 'idle' && <span className="status-dot h-1.5 w-1.5 bg-white" />}
                            {statusConfig.code} // {statusConfig.label}
                        </span>
                    </div>
                </div>
            </header>


            <main ref={scrollRef} className="flex-1 overflow-y-auto draft-grid p-6">
                <div className="mx-auto max-w-4xl space-y-6">

                    {messages.length === 0 ? (
                        <div className="mt-20 border border-zinc-800 bg-[#111] p-8 text-center max-w-lg mx-auto">
                            <p className="mono-label text-zinc-500 mb-4">CONNECTION_ESTABLISHED</p>
                            <p className="text-sm font-mono text-zinc-400 mb-6">
                                System initialized and awaiting input. Audio pipeline green. Qdrant index mounted.
                            </p>
                            <div className="text-xs font-mono text-zinc-600">
                                &#62; Try: "What are the passing criteria for compiler design lab?"
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, i) => (
                            <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                <div className="mb-1 mono-label text-zinc-600">
                                    {msg.role === "user" ? "USER_INPUT" : `NODE_RESPONSE [${agent.name}]`}
                                </div>

                                <div className={`
                  max-w-[85%] text-sm leading-relaxed p-4
                  ${msg.role === "user"
                                        ? "bg-white text-black"
                                        : "bg-[#111] border border-zinc-800 text-zinc-200 accent-border"
                                    }
                `}>
                                    <div className="whitespace-pre-wrap">{msg.content}</div>

                                    {msg.role === "assistant" && msg.usedRAG && (
                                        <div className="mt-3 border-t border-zinc-800 pt-2 font-mono text-[10px] text-zinc-500 flex items-center justify-between">
                                            <span>[LOG: VECTOR_SEARCH_EXECUTED]</span>
                                            <span>QDRANT_RAG</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}

                    {voiceState === "thinking" && (
                        <div className="flex flex-col items-start">
                            <div className="mb-1 mono-label text-zinc-600">`NODE_RESPONSE [${agent.name}]`</div>
                            <div className="bg-[#111] border border-zinc-800 p-4 accent-border">
                                <span className="font-mono text-sm text-zinc-500 animate-pulse">_GENERATING</span>
                            </div>
                        </div>
                    )}

                </div>
            </main>


            <footer className="border-t border-zinc-800 bg-[#111] p-6 shrink-0">
                <div className="mx-auto max-w-4xl flex items-end gap-4">

                    <button
                        onClick={handleMicClick}
                        disabled={voiceState === "transcribing" || voiceState === "thinking" || voiceState === "speaking"}
                        className={`
              flex h-12 w-12 shrink-0 items-center justify-center border font-mono text-xs font-bold transition-colors disabled:opacity-30
              ${voiceState === "recording"
                                ? "bg-white text-black border-white"
                                : "bg-[#0a0a0a] text-white border-zinc-700 hover:border-white"
                            }
            `}
                    >
                        {voiceState === "recording" ? "STOP" : "MIC"}
                    </button>

                    <form onSubmit={handleTextSubmit} className="flex-1 flex gap-2">
                        <div className="relative flex-1">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 mono-label text-zinc-600">&#62;</div>
                            <input
                                type="text"
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                placeholder="MANUAL_OVERRIDE_INPUT..."
                                className="w-full border border-zinc-800 bg-[#0a0a0a] py-3 pl-10 pr-4 text-sm font-mono text-white placeholder-zinc-700 outline-none focus:border-white focus:bg-zinc-900 transition-colors"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!textInput.trim() || chatMutation.isPending}
                            className="border border-white bg-white px-6 font-bold text-black hover:bg-zinc-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm"
                        >
                            SEND
                        </button>
                    </form>

                </div>
            </footer>
        </div>
    );
}
