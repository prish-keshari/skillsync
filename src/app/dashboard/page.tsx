"use client";

import Link from "next/link";
import { api } from "~/trpc/react";
import { Navbar } from "~/app/_components/Navbar";

export default function DashboardPage() {
    const { data: agents, isLoading } = api.agent.getAll.useQuery();
    const utils = api.useUtils();

    const deleteAgent = api.agent.delete.useMutation({
        onSuccess: () => utils.agent.getAll.invalidate(),
    });

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            <Navbar />
            <main className="mx-auto max-w-5xl px-6 py-12">
                <header className="mb-12 flex items-end justify-between border-b border-zinc-800 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">AGENT_CONSOLE</h1>
                        <p className="mt-2 mono-label text-zinc-500">
                            Deployment and configuration matrix
                        </p>
                    </div>
                    <Link
                        href="/dashboard/create-agent"
                        className="border border-white bg-white px-4 py-2 text-sm font-bold text-black hover:bg-zinc-200 transition-colors"
                    >
                        [+] NEW DEPLOYMENT
                    </Link>
                </header>

                {isLoading ? (
                    <div className="py-20 text-center mono-label text-zinc-500">
                        <span className="status-dot inline-block h-2 w-2 bg-white mr-2" />
                        Querying index...
                    </div>
                ) : !agents?.length ? (
                    <div className="panel border-dashed p-16 text-center">
                        <p className="mono-label text-zinc-500">DATASET EMPTY</p>
                        <p className="mt-2 text-zinc-300">
                            No active deployments found for assigned user ID.
                        </p>
                        <Link
                            href="/dashboard/create-agent"
                            className="mt-6 inline-block border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium hover:bg-zinc-800 transition-colors"
                        >
                            INITIALIZE AGENT_01
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-px bg-zinc-800 border border-zinc-800">
                        {agents.map((agent: { id: string; name: string; systemPrompt: string; isPublic: boolean; createdAt: Date }) => (
                            <div
                                key={agent.id}
                                className="bg-[#111] p-6 hover:bg-[#151515] transition-colors group flex items-start justify-between"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-4">
                                        <div className="h-6 w-6 border-2 border-white flex items-center justify-center">
                                            <div className="h-2 w-2 bg-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold tracking-tight text-white">{agent.name}</h3>
                                            <div className="mt-1 flex items-center gap-4 mono-label text-zinc-600">
                                                <span className="flex items-center gap-1.5">
                                                    <div className={`h-1.5 w-1.5 ${agent.isPublic ? "bg-green-500" : "bg-zinc-600"}`} />
                                                    {agent.isPublic ? "PUBLIC_NET" : "PRIVATE_NODE"}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <div className="h-1.5 w-1.5 bg-white" />
                                                    RAG_ACTIVE
                                                </span>
                                                <span>
                                                    {new Date(agent.createdAt).toISOString().split('T')[0]}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-5 pl-10 border-l border-zinc-800 ml-3">
                                        <p className="text-sm font-mono text-zinc-400 line-clamp-2">
                                            &#62; {agent.systemPrompt}
                                        </p>
                                    </div>
                                </div>

                                <div className="ml-8 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Link
                                        href={`/agent/${agent.id}`}
                                        className="border border-zinc-700 px-4 py-1.5 text-xs font-bold hover:bg-white hover:text-black transition-colors text-center"
                                    >
                                        CONNECT
                                    </Link>
                                    <button
                                        onClick={() => deleteAgent.mutate({ id: agent.id })}
                                        className="border border-transparent px-4 py-1.5 text-xs font-bold text-red-500 hover:border-red-900/50 hover:bg-red-950/20 transition-colors"
                                    >
                                        TERMINATE
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
