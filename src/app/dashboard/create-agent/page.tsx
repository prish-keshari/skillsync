"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Navbar } from "~/app/_components/Navbar";

export default function CreateAgentPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [systemPrompt, setSystemPrompt] = useState("");

    const createAgent = api.agent.create.useMutation({
        onSuccess: () => router.push("/dashboard"),
        onError: (err) => {
            alert(`Failed to create agent: ${err.message}`);
        },
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim() || !systemPrompt.trim()) return;
        createAgent.mutate({ name, systemPrompt });
    }

    const templates = [
        {
            name: "EDU_ASSISTANT",
            prompt: "You are a helpful university assistant. When a user asks questions about courses, labs, exams, syllabi, grading, or any academic information, you MUST use the search_knowledge_base tool to find accurate data. Never guess academic information — always search first. Be specific, cite the data you find, and be concise.",
        },
        {
            name: "CODE_TUTOR",
            prompt: "You are a patient programming tutor. For general coding questions, answer directly. When asked about specific course curricula, lab experiments, or exam patterns, use the search_knowledge_base tool to find accurate information. Explain concepts clearly with examples.",
        },
        {
            name: "EXAM_PREP_UNIT",
            prompt: "You are an exam preparation companion. When students ask about specific courses, passing criteria, or syllabi, ALWAYS use the search_knowledge_base tool first. Then quiz them on the topics, generate practice questions, and provide study tips based on the actual curriculum data.",
        },
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            <Navbar />
            <main className="mx-auto max-w-2xl px-6 py-12">
                <header className="mb-10 border-b border-zinc-800 pb-6">
                    <div className="mono-label mb-2 text-zinc-500">SYSTEM / CONFIGURATION</div>
                    <h1 className="text-2xl font-bold tracking-tight">INITIALIZE_AGENT</h1>
                </header>


                <div className="mb-8 border border-zinc-800 bg-[#111] p-4 text-sm font-mono flex gap-4 items-start">
                    <div className="text-zinc-500 mt-1">{"[*]"}</div>
                    <div>
                        <div className="text-white mb-2">MODULE LOADED: RAG_Vector_Search</div>
                        <div className="text-zinc-400 leading-relaxed">
                            All deployments auto-mount <span className="text-white">search_knowledge_base</span> tool.
                            Inference engine autonomously evaluates intent and queries Qdrant index prior to synthesis.
                        </div>
                    </div>
                </div>


                <div className="mb-8">
                    <p className="mono-label mb-3 text-zinc-500">LOAD PRESET CONFIGURATION:</p>
                    <div className="flex flex-wrap gap-2">
                        {templates.map((t) => (
                            <button
                                key={t.name}
                                type="button"
                                onClick={() => {
                                    setName(t.name);
                                    setSystemPrompt(t.prompt);
                                }}
                                className="border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-mono text-zinc-300 hover:bg-white hover:text-black hover:border-white transition-colors"
                            >
                                {t.name}
                            </button>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="mono-label mb-2 flex text-zinc-500">
                            AGENT_IDENTIFIER
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. SYS_OPERATOR"
                            className="w-full border border-zinc-800 bg-[#111] px-4 py-3 text-white font-mono placeholder-zinc-700 outline-none focus:border-white focus:bg-zinc-900 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="mono-label mb-2 flex text-zinc-500">
                            SYSTEM_PROMPT_DIRECTIVES
                        </label>
                        <textarea
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            placeholder="Define operational boundaries..."
                            rows={8}
                            className="w-full border border-zinc-800 bg-[#111] px-4 py-3 text-white font-mono text-sm leading-relaxed placeholder-zinc-700 outline-none focus:border-white focus:bg-zinc-900 transition-colors resize-none"
                        />
                        <div className="mt-2 flex justify-end">
                            <span className="mono-label text-zinc-600">
                                BUFFER: {systemPrompt.length}/5000 BYTES
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-zinc-800">
                        <button
                            type="submit"
                            disabled={createAgent.isPending || !name.trim() || !systemPrompt.trim()}
                            className="border border-white bg-white px-6 py-2.5 text-sm font-bold text-black hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {createAgent.isPending ? "COMPILING..." : "DEPLOY"}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="border border-zinc-800 px-6 py-2.5 text-sm font-bold text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
                        >
                            ABORT
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
