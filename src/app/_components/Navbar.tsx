"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { api } from "~/trpc/react";
import { usePathname } from "next/navigation";

export function Navbar() {
    const { data } = api.agent.getCredits.useQuery(undefined, {
        retry: false,
    });
    const pathname = usePathname();


    if (pathname === "/") return null;

    return (
        <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-[#0a0a0a]">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3">


                <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div className="h-4 w-4 bg-white" />
                    <span className="font-bold tracking-tight text-white">SKILLSYNC</span>
                </Link>


                <div className="flex items-center gap-6">
                    {data && (
                        <div className="mono-label flex items-center gap-2 text-zinc-400">
                            <span className="h-1.5 w-1.5 bg-zinc-400" />
                            COMPUTE_CREDITS: <span className="text-white">{data.credits.toString().padStart(4, '0')}</span>
                        </div>
                    )}

                    <div className="h-4 w-px bg-zinc-800" />

                    <UserButton
                        appearance={{
                            elements: {
                                avatarBox: "h-7 w-7 rounded-none border border-zinc-700",
                            },
                        }}
                    />
                </div>
            </div>
        </nav>
    );
}
