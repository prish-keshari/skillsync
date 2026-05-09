

const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const MAGENTA = "\x1b[35m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const DIM = "\x1b[2m";

function timestamp() {
    return new Date().toISOString().split("T")[1]?.slice(0, 12) ?? "";
}

export const logger = {
    groq(message: string) {
        console.log(`${DIM}${timestamp()}${RESET} ${CYAN}[Groq LLM]${RESET} ${message}`);
    },
    skill(message: string) {
        console.log(`${DIM}${timestamp()}${RESET} ${YELLOW}[Skill Triggered]${RESET} ${message}`);
    },
    rag(message: string) {
        console.log(`${DIM}${timestamp()}${RESET} ${MAGENTA}[Qdrant RAG]${RESET} ${message}`);
    },
    credits(message: string) {
        console.log(`${DIM}${timestamp()}${RESET} ${GREEN}[Credits]${RESET} ${message}`);
    },
    error(message: string) {
        console.error(`${DIM}${timestamp()}${RESET} ${RED}[Error]${RESET} ${message}`);
    },
    whisper(message: string) {
        console.log(`${DIM}${timestamp()}${RESET} ${CYAN}[Whisper STT]${RESET} ${message}`);
    },
    tts(message: string) {
        console.log(`${DIM}${timestamp()}${RESET} ${GREEN}[TTS]${RESET} ${message}`);
    },
};
