"use client";

import { useRef, useState, useCallback } from "react";
import { api } from "~/trpc/react";

type VoiceState = "idle" | "recording" | "transcribing" | "thinking" | "speaking";

export function useVoice() {
    const [state, setState] = useState<VoiceState>("idle");
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const transcribeMutation = api.transcribe.transcribe.useMutation();

    const startRecording = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
        chunksRef.current = [];

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.start();
        mediaRecorderRef.current = recorder;
        setState("recording");
    }, []);

    const stopRecording = useCallback(async (): Promise<string> => {
        return new Promise((resolve, reject) => {
            const recorder = mediaRecorderRef.current;
            if (!recorder) {
                reject(new Error("No recorder"));
                return;
            }

            recorder.onstop = async () => {
                setState("transcribing");
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });


                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = async () => {
                    const base64 = (reader.result as string).split(",")[1] ?? "";
                    try {
                        const result = await transcribeMutation.mutateAsync({
                            audioBase64: base64,
                        });
                        setState("idle");
                        resolve(result.text);
                    } catch (err) {
                        setState("idle");
                        reject(err);
                    }
                };


                recorder.stream.getTracks().forEach((t) => t.stop());
            };

            recorder.stop();
        });
    }, [transcribeMutation]);

    const speak = useCallback((text: string) => {
        if (!window.speechSynthesis) return;
        setState("speaking");
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 1;
        utterance.onend = () => setState("idle");
        window.speechSynthesis.speak(utterance);
    }, []);

    return { state, setState, startRecording, stopRecording, speak };
}
