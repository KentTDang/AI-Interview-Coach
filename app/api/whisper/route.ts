import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { transcription, history } = await req.json();

    if (!transcription) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
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

    const audioTranscription = response.choices[0].message.audio?.transcript;
    const audioDataBase64 = response.choices[0]?.message?.audio?.data;

    return NextResponse.json({
      audio: audioDataBase64,
      transcription: audioTranscription,
    });
  } catch (err) {
    console.error("Error generating audio, please make sure you have an openai api key in your settings:", err);
    return NextResponse.json(
      { error: "Error generating audio,please make sure you have an openai api key in your settings." },
      { status: 500 }
    );
  }
}
