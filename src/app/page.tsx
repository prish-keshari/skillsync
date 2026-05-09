import Link from "next/link";
import { SignInButton, Show } from "@clerk/nextjs";

export default function HomePage() {
  return (
    <main className="min-h-screen draft-grid flex flex-col pt-[57px]">


      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800 bg-[#0a0a0a] px-6 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 bg-white" />
            <span className="font-bold tracking-tight">SKILLSYNC <span className="text-zinc-500 font-normal">SYS</span></span>
          </div>
          <Show when="signed-in">
            <Link
              href="/dashboard"
              className="border border-zinc-800 bg-zinc-900 px-4 py-1.5 text-sm font-medium hover:bg-white hover:text-black"
            >
              ACCESS CONSOLE
            </Link>
          </Show>
          <Show when="signed-out">
            <div className="border border-white bg-white px-4 py-1.5 text-sm font-medium text-black hover:bg-zinc-200 cursor-pointer">
              <SignInButton mode="modal">INITIALIZE</SignInButton>
            </div>
          </Show>
        </div>
      </nav>


      <section className="mx-auto w-full max-w-5xl px-6 py-32">
        <div className="flex flex-col items-start max-w-3xl">
          <div className="mono-label mb-6 border border-zinc-800 bg-zinc-950 px-3 py-1 text-zinc-400">
            [SYS_STATUS: ONLINE]
          </div>

          <h1 className="text-6xl font-bold leading-[1.05] tracking-tighter sm:text-8xl">
            Autonomous
            <br />
            <span className="text-zinc-500">Inference</span> Engine.
          </h1>

          <p className="mt-8 max-w-xl text-lg font-light leading-relaxed text-zinc-400">
            SkillSync deploys low-latency conversational agents. Bound by strict RAG protocols. Powered by Llama 3 via Groq hardware. Zero hallucinations. Exact execution.
          </p>

          <div className="mt-12 flex items-center gap-4">
            <Show when="signed-out">
              <div className="border border-white bg-white px-8 py-4 text-sm font-bold tracking-wide text-black hover:bg-zinc-200 cursor-pointer">
                <SignInButton mode="modal">DEPLOY AGENT</SignInButton>
              </div>
            </Show>
            <Show when="signed-in">
              <Link
                href="/dashboard"
                className="border border-white bg-white px-8 py-4 text-sm font-bold tracking-wide text-black hover:bg-zinc-200"
              >
                ENTER CONSOLE_
              </Link>
            </Show>
            <a
              href="#architecture"
              className="border border-zinc-800 px-8 py-4 text-sm font-bold tracking-wide text-zinc-400 hover:border-zinc-600 hover:text-white"
            >
              VIEW SPECS
            </a>
          </div>
        </div>
      </section>


      <section id="architecture" className="border-t border-zinc-800 bg-[#0a0a0a]">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-800">
            {[
              {
                id: "01",
                title: "CORE COMPUTE",
                desc: "Inference routed through Groq architecture. Sub-second token generation for real-time voice streaming.",
                metric: "< 800ms Latency"
              },
              {
                id: "02",
                title: "VECTOR RETRIEVAL",
                desc: "Autonomous tool execution to query Qdrant RAG index. Context injected dynamically pre-synthesis.",
                metric: "Zero Hallucination"
              },
              {
                id: "03",
                title: "VOICE I/O LAYER",
                desc: "Raw audio captured via MediaRecorder buffer, transcribed via Whisper-large-v3, synthesized instantly.",
                metric: "Full Duplex"
              },
            ].map((f) => (
              <div key={f.id} className="p-10 hover:bg-zinc-900/50 transition-colors">
                <div className="mono-label mb-8 text-zinc-600">{f.id} // {f.title}</div>
                <p className="text-zinc-300 leading-relaxed font-light">{f.desc}</p>
                <div className="mt-8 border-t border-zinc-800 pt-4">
                  <span className="mono-label text-white">{f.metric}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      <section className="border-t border-zinc-800 bg-[#111]">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="mb-12">
            <span className="mono-label text-zinc-500">SYSTEM ARCHITECTURE</span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight">Execution Pipeline</h2>
          </div>

          <div className="panel p-0 overflow-hidden font-mono text-sm leading-relaxed text-zinc-400">
            <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-2 text-xs text-zinc-500 flex gap-4">
              <span>orchestrator.ts</span>
              <span>--trace</span>
            </div>
            <div className="p-6 md:p-10">
              <div className="text-white">USER_INPUT &#62; "Compiler passing criteria"</div>
              <div className="mt-2 text-zinc-600">│</div>
              <div className="text-zinc-300">├─ INTENT_EVAL: Analyzing via Llama-3-70b</div>
              <div className="text-white mt-1">│  └─ TOOL_CALL_DETECTED: search_knowledge_base</div>
              <div className="mt-2 text-zinc-600">│</div>
              <div className="text-zinc-300">├─ VECTOR_SEARCH: Qdrant Index [university_knowledge]</div>
              <div className="text-white mt-1">│  ├─ Embedding generated (nomic-embed-text-v1_5)</div>
              <div className="text-white">│  ├─ Distance computation: Cosine</div>
              <div className="text-white">│  └─ RETURN: 3 nodes found</div>
              <div className="mt-2 text-zinc-600">│</div>
              <div className="text-zinc-300">└─ SYNTHESIS: Injecting context payload</div>
              <div className="text-white mt-1">   └─ RESPONSE_STREAM: Active</div>
            </div>
          </div>
        </div>
      </section>


      <footer className="border-t border-zinc-800 py-8">
        <div className="mx-auto max-w-6xl px-6 flex items-center justify-between text-xs text-zinc-600 font-mono">
          <span>&copy; {new Date().getFullYear()} SKILLSYNC</span>
          <span className="flex gap-4">
            <span className="hover:text-white transition-colors cursor-pointer">/NEXT</span>
            <span className="hover:text-white transition-colors cursor-pointer">/GROQ</span>
            <span className="hover:text-white transition-colors cursor-pointer">/QDRANT</span>
          </span>
        </div>
      </footer>
    </main>
  );
}