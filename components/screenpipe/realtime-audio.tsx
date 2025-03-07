"use client";

import { useEffect, useState, useRef } from "react";
import { pipe, type TranscriptionChunk } from "@screenpipe/browser";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useSettings } from "@/lib/settings-provider";
import { useMetrics } from "@/context/MetricsContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import OpenAI from "openai";

export function RealtimeAudio({
  onDataChange,
}: {
  onDataChange?: (data: any, error: string | null) => void;
}) {
  const { settings } = useSettings();
  const [transcription, setTranscription] = useState<TranscriptionChunk | null>(
    null
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const isStreamingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState("");
  const historyRef = useRef(history);
  const streamRef = useRef<any>(null);
  const transcriptionRef = useRef("");
  const [audioSrc, setAudioSrc] = useState<string>("");
  const [summary, setSummary] = useState<string | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const [isResponding, setIsResponding] = useState<boolean>(false);

  const { metrics } = useMetrics();

  // Update ref when history changes
  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  const startStreaming = async () => {
    try {
      // Check if realtime transcription is enabled
      if (!settings?.screenpipeAppSettings?.enableRealtimeAudioTranscription) {
        const errorMessage =
          "realtime audio transcription is not enabled in settings, go to account-> settings -> recording -> enable realtime audiotranscription -> models to use: screenpipe cloud. Then Refresh. If it doesn't start you might need to restart.";
        setError(errorMessage);

        // Pass the error to the parent component
        if (onDataChange) {
          onDataChange(null, errorMessage);
        }

        return; // Exit early
      }

      setError(null);
      setIsStreaming(true);
      isStreamingRef.current = true;

      // Add error handling for the analytics connection issue
      const originalConsoleError = console.error;
      console.error = function (msg, ...args) {
        // Filter out the analytics connection errors
        if (
          typeof msg === "string" &&
          (msg.includes("failed to fetch settings") ||
            msg.includes("ERR_CONNECTION_REFUSED"))
        ) {
          // Suppress these specific errors
          return;
        }
        originalConsoleError.apply(console, [msg, ...args]);
      };

      const stream = pipe.streamTranscriptions();
      streamRef.current = stream;

      for await (const event of stream) {
        if (!isStreamingRef.current) {
          break;
        }
        if (event.choices?.[0]?.text) {
          const chunk: TranscriptionChunk = {
            transcription: event.choices[0].text,
            timestamp: event.metadata?.timestamp || new Date().toISOString(),
            device: event.metadata?.device || "unknown",
            is_input: event.metadata?.isInput || false,
            is_final: event.choices[0].finish_reason !== null,
          };

          setTranscription(chunk);
          transcriptionRef.current += " " + chunk.transcription;

          // Pass the raw data to the parent component for display in the raw output tab
          if (onDataChange) {
            onDataChange(chunk, null);
          }

          if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
          }
          debounceTimeoutRef.current = setTimeout(() => {
            const newHistory =
              historyRef.current + "You: " + transcriptionRef.current + "\n";
            setHistory(newHistory);
            historyRef.current = newHistory;

            generateAudio();
            transcriptionRef.current = "";
            debounceTimeoutRef.current = null;
          }, 5000);
        }
      }

      // Restore original console.error
      console.error = originalConsoleError;
    } catch (error) {
      console.error("audio stream failed:", error);
      const errorMessage =
        error instanceof Error
          ? `Failed to stream audio: ${error.message}`
          : "Failed to stream audio";
      setError(errorMessage);

      // Pass the error to the parent component
      if (onDataChange) {
        onDataChange(null, errorMessage);
      }

      setIsStreaming(false);
      isStreamingRef.current = false;
    }
  };

  const stopStreaming = () => {
    if (streamRef.current) {
      streamRef.current.return?.();
    }
    setIsStreaming(false);
    isStreamingRef.current = false;
  };

  useEffect(() => {
    return () => {
      stopStreaming();
    };
  }, []);

  const generateSummary = async () => {
    setLoading(true);
    const openaiApiKey = settings?.screenpipeAppSettings?.openaiApiKey;
    const client = new OpenAI({
      apiKey: openaiApiKey,
      dangerouslyAllowBrowser: true,
    });
    try {
      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
              You are a professional recruiter and interview coach reviewing a recorded mock interview session. 
              Alloy is the interviewer and 'You' is the interviewee. 'You' is the person you will be evaluating.
              Your goal is to provide a comprehensive performance review that helps the interviewee improve their interviewing skills, 
              both in terms of verbal responses and non-verbal communication (body language, posture, eye contact, etc.).
  
              Areas to Cover in Your Summary:
              Overall Communication & Structure:
              Evaluate whether the interviewee answered each question using a clear and structured format (such as the STAR method: Situation, Task, Action, Result).
  
              If their responses lacked structure, explain how they should have organized their answers to be clearer and more impactful.
  
              Assess whether they highlighted concrete achievements and quantified their impact when discussing their experiences.
  
              Provide specific examples where they could have improved the clarity, relevance, or depth of their responses.
  
              Content Quality & Technical Depth:
              Analyze if the interviewee’s answers demonstrated the necessary knowledge.
  
              Identify any areas where they seemed uncertain, lacked depth, or could have elaborated more on their expertise.
  
              Suggest ways to enhance their explanations for greater impact.
  
              Body Language & Non-Verbal Communication:
              
              Assess their posture: Did they have a high bad posture count and maintained bad posture for a long duration of the interview?
  
              Review their eye contact: Did they maintain good eye contact with the interviewer, or were they frequently looking away?
  
              Evaluate their hand gestures: Were they using their hands too much or too little?
              
  
              Explain why strong body language is important in building confidence and trust, and suggest specific improvements for their body language.
  
              Confidence & Overall Impression:
              Did the interviewee come across as confident, well-prepared, and articulate?
  
              Identify any habits, tone of voice, or speaking patterns that reduced the strength of their delivery.
  
              Offer practical tips to enhance their confidence, tone, and presence in future interviews.
  
              Actionable Next Steps:
              Summarize the top 3-5 most important areas for improvement, combining both content and body language feedback.
              Provide a concise improvement plan the interviewee can follow to elevate their next performance.
              Tone:
              Be constructive, encouraging, and professional — the goal is to help the interviewee grow, not to criticize.
  
              Example Output (if helpful):
              “In your answer to the system design question, you explained the components well but lacked a clear structure. In the future, begin by stating the high-level architecture before diving into specific details. You also tended to avoid eye contact when discussing unfamiliar topics — maintaining steady eye contact helps convey confidence even if you’re thinking through your answer.”
  
              Final Goal:
              Your review should provide a balanced assessment of both the verbal responses and the non-verbal presence, helping the interviewee improve in both content delivery and professional presence.
  
              IMPORTANT: Use complete sentences and paragraphs only. Do not use any Markdown, special symbols, or bullet points.
            `,
          },
          { role: "user", content: `Conversation History: ${history}` },
          {
            role: "user",
            content: `Interview Body Language Results: ${metrics}`,
          },
        ],
        store: true,
      });
      setSummary(response.choices[0].message.content);
    } catch (err) {
      console.error("Error generating summary:", err);
      setSummary("An error occurred while generating the summary.");
    } finally {
      setLoading(false);
    }
  };

  const generateAudio = async () => {
    if (!isStreamingRef.current) return;
    const openaiApiKey = settings?.screenpipeAppSettings?.openaiApiKey;
    const client = new OpenAI({
      apiKey: openaiApiKey,
      dangerouslyAllowBrowser: true,
    });
    setIsResponding(true);
    try {
      const response = await client.chat.completions.create({
        model: "gpt-4o-audio-preview",
        modalities: ["text", "audio"],
        audio: { voice: "alloy", format: "wav" },
        messages: [
          {
            role: "system",
            content: `
          Your name is Alloy, professional interviewer conducting a mock interview for a candidate. 
          Your goal is to evaluate the candidate’s responses, identify areas for improvement,
          and provide constructive feedback on how they can enhance their answers, while conducting the interview.
          IMPORTANT: Use complete sentences and paragraphs only. Do not use any Markdown, special symbols, or bullet points.`,
          },
          { role: "user", content: `Conversation History: ${history}` },
          {
            role: "user",
            content: `Current conversation response or question: ${transcription}`,
          },
        ],
        store: true,
      });

      const audio = response.choices[0]?.message?.audio?.data;
      const audioTranscription = response.choices[0].message.audio?.transcript;
      if (audio) {
        const binaryString = atob(audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const audioBlob = new Blob([bytes], { type: "audio/wav" });

        const audioUrl = URL.createObjectURL(audioBlob);

        const newHistory =
          historyRef.current + "Alloy: " + audioTranscription + "\n";
        setHistory(newHistory);

        setAudioSrc(audioUrl);
      }
    } catch (error) {
      console.error("Error generating audio:", error);
      setError("Error generating audio");
    } finally {
      setIsResponding(false);
    }
  };

  const renderTranscriptionContent = (
    transcription: TranscriptionChunk | null
  ) => {
    return (
      <div className="space-y-2 text-xs">
        <div className="flex flex-col text-slate-600">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-semibold">timestamp: </span>
              <span>
                {transcription
                  ? new Date(transcription.timestamp).toLocaleString()
                  : ""}
              </span>
            </div>
            <div>
              <span className="font-semibold">device: </span>
              <span>{transcription ? transcription.device : ""}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-semibold">type: </span>
              <span>
                {transcription
                  ? transcription.is_input
                    ? "Input"
                    : "Output"
                  : ""}
              </span>
            </div>
            <div>
              <span className="font-semibold">final: </span>
              <span>
                {transcription ? (transcription.is_final ? "Yes" : "No") : ""}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-100 rounded p-2 overflow-auto max-h-[100px] whitespace-pre-wrap font-mono text-xs">
          {transcription ? transcription.transcription : ""}
        </div>

        <div className="mt-2">
          <div className="text-slate-600 font-semibold mb-1">History:</div>
          <div className="bg-slate-100 rounded p-2 overflow-auto h-[130px] whitespace-pre-wrap font-mono text-xs">
            {history}
          </div>
        </div>
      </div>
    );
  };

  const renderSummaryContent = () => {
    return (
      <div className="mt-2">
        <div className="text-slate-600 font-semibold mb-1">Summary:</div>
        <div className="bg-slate-100 rounded p-2 overflow-auto h-[130px] whitespace-pre-wrap font-mono text-xs">
          {summary}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex justify-between items-center">
        <Button
          onClick={isStreaming ? stopStreaming : startStreaming}
          size="sm"
          className="mb-2"
        >
          {isStreaming ? (
            <>
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              Stop Streaming
            </>
          ) : (
            "Start Audio Transcritpion Stream"
          )}
        </Button>

        {history && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(history);
              setHistory("");
            }}
          >
            Clear History
          </Button>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
      {renderTranscriptionContent(transcription)}

      <div className="flex items-center gap-1.5 text-right justify-end">
        <div
          className={`w-1.5 h-1.5 rounded-full ${
            isStreaming ? "bg-green-500" : "bg-gray-400"
          }`}
        />
        <span className="text-xs text-gray-500 font-mono">
          {isStreaming ? "streaming" : "stopped"}
        </span>
      </div>

      <Button onClick={generateSummary}>
        {" "}
        {loading ? (
          <>
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Creating Summary
          </>
        ) : (
          "Interview Summary"
        )}
      </Button>
      {summary && renderSummaryContent()}

      <Card className="mt-10">
        <CardHeader className="pb-2 bottom-0">
          <CardTitle className="text-lg flex items-center gap-2">
            Interviewer&apos;s Audio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status:</span>
              <Badge
                variant={
                  isStreaming && isResponding ? "destructive" : "default"
                }
                className={
                  isStreaming
                    ? isResponding
                      ? "bg-red-500"
                      : "bg-green-500"
                    : "bg-red-500"
                }
              >
                {isStreaming
                  ? isResponding
                    ? "Generating a response, please wait"
                    : "Listening"
                  : "Off"}
              </Badge>
            </div>
          </div>
          {error && <p>{error}</p>}
          {audioSrc && (
            <audio controls src={audioSrc} autoPlay>
              Your browser does not support the audio element.
            </audio>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
