import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "fs"
import path from "path"



type ResponseData = {
    message: string,
    response: object
}

const openAI = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY });
const ASSITANT_ID = process.env.NEXT_PUBLIC_OPENAI_ASSISTANT_ID // or gpt-4
const ASSISTANT_NAME = "Whisper-NEXT"

let threadId: string | null = null;

const initializeAssistant = async () => {
    try {
        const assistants = await openAI.beta.assistants.list({
            order: "desc",
            limit: 100
        })

        let assistant = assistants.data.find(a => a.name === ASSISTANT_NAME);

        if (!assistant) {
            console.log("ASSITANT NOT FOUND")
            assistant = await openAI.beta.assistants.create({
                name: ASSISTANT_NAME,
                description: "Whisper AI Assitant",
                model: "gpt-3.5-turbo",
            });
            console.log("ASSITANT CREATED")
        }
        else {
            console.log(`Found existing assistant: ${ASSISTANT_NAME} with ID: ${assistant.id}`);
        }

        const thread = await openAI.beta.threads.create()
        threadId = thread.id
        console.log("THREAD ID: ", thread.id)
        return assistant.id

    } catch (e) {
        console.log("ASSITANT ERROR: ", e.message)
        return null;
    }
}

// Initialize openAI asssitant
initializeAssistant().then((assistantId) => {
    if (assistantId) {
        console.log(`Assistant initialization complete. Using ID: ${assistantId}`);
    } else {
        console.error("Assistant initialization failed.");
    }
});

// save temporarily to mp3
const temp_save_to_mp3 = async (file: Base64URLString) => {
    try {
        console.log("SAVING FILE: ")
        // const buffer = Buffer.from(file, 'base64');
        const base64Data = file.includes('base64,')
            ? file.split('base64,')[1]
            : file;

        const buffer = Buffer.from(base64Data, 'base64');
        const tempDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }
        const filePath = path.join(tempDir, `audio-${Date.now()}.mp3`);
        fs.writeFileSync(filePath, buffer);
        return filePath;
    } catch (e) {
        console.log("TEMP FILE ERROR: ", e.message)
        return null;
    }
}

// Read mp3 file for transcription
const reading_mp3 = async () => {
    try {

        const tempDir = path.join(process.cwd(), "temp");
        console.log("TEMP DIR: ", tempDir)
        // Read files in the directory
        const files = fs.readdirSync(tempDir)
            .filter(file => file.endsWith(".mp3")) // Filter only MP3 files
            .map(file => ({
                name: file,
                time: fs.statSync(path.join(tempDir, file)).mtime.getTime(), // Get modification time
            }))
            .sort((a, b) => b.time - a.time); // Sort by latest modified first

        if (files.length === 0) {
            return null; // No MP3 files found
        }

        return path.join(tempDir, files[0].name); // Return the latest MP3 file
    } catch (e) {
        console.log("READING MP3 ERROR: ", e.message)
        return null;
    }

};

// Transcribe the audio file using OpenAI API
const transcribeAudio = async () => {
    const lastFilePath = await reading_mp3()

    if (!lastFilePath) {
        console.log("No file found")
        return
    }

    try {
        const transcipriton = await openAI.audio.transcriptions.create({
            file: fs.createReadStream(lastFilePath),
            model: "whisper-1",
        })

        console.log(transcipriton.text)
        if (transcipriton.text.length < 1) {
            {
                return { statusCode: 400, message: "No transcription found" }
            }
        }

        const response = await get_response_from_assitant(transcipriton.text);

        return { transcription: transcipriton.text, keypoints: response, role: "assistant" }
    }
    catch (e) {
        console.log("TRANSCIRPTION ERROR: ", e.message)
    }
}

const get_response_from_assitant = async (message: string) => {
    try {
        if (!threadId) {
            const thread = await openAI.beta.threads.create()
            threadId = thread.id;
        }

        await openAI.beta.threads.messages.create(threadId, {
            role: "user",
            content: message
        })

        const run = await openAI.beta.threads.runs.create(threadId, {
            assistant_id: ASSITANT_ID,
        })

        let runStatus = await openAI.beta.threads.runs.retrieve(threadId, run.id)

        while (runStatus.status !== "completed") {
            if (["failed", "cancelled", "expired"].includes(runStatus.status)) {
                throw new Error(`Run ended with status: ${runStatus.status}`);
            }

            // Wait before checking again
            await new Promise((resolve) => setTimeout(resolve, 1000));
            runStatus = await openAI.beta.threads.runs.retrieve(threadId, run.id);
        }
        // Get only the latest message (limit=1)
        const messages = await openAI.beta.threads.messages.list(threadId, {
            limit: 1,
            order: "desc"
        });

        // Check if we have at least one message and it's from the assistant
        if (messages.data.length > 0 && messages.data[0].role === "assistant") {
            const latestMessage = messages.data[0];
            const messageContent = latestMessage.content[0].type === "text"
                ? latestMessage.content[0].text.value
                : "";

            console.log("ASSISTANT MESSAGE:", messageContent);
            return messageContent;
        } else {
            // If the latest message isn't from the assistant (rare case), get the first assistant message
            const assistantMessages = await openAI.beta.threads.messages.list(threadId, {
                limit: 10,  // Get a few recent messages
                order: "desc"
            });

            const firstAssistantMessage = assistantMessages.data.find(msg => msg.role === "assistant");

            if (firstAssistantMessage) {
                const messageContent = firstAssistantMessage.content[0].type === "text"
                    ? firstAssistantMessage.content[0].text.value
                    : "";

                console.log("ASSISTANT MESSAGE (fallback):", messageContent);
                return messageContent;
            }

            console.log("No assistant response found");
            return null;
        }
    } catch (error) {
        console.error("Error getting assistant response:", error.message);
        return null;
    }
}

//Delete after transcription is Complete
// const delete_temp_file = async (filePath: string) => {
//     const lastFilePath = await reading_mp3()
//     try {
//         if (fs.existsSync(lastFilePath)) {
//             fs.unlinkSync(lastFilePath);
//             console.log(`Deleted temporary file: ${filePath}`);
//         }
//     } catch (error) {
//         console.error("Error deleting file:", error.message);
//     }
// };


export async function POST(request: NextRequest) {

    try {
        const formData = await request.json()
        // console.log(formData)
        const { audio } = formData
        console.log("FILE: ", audio)
        if (!audio) {
            return NextResponse.json({ message: "No file found" } as ResponseData, { status: 400 });
        }
        const path = temp_save_to_mp3(audio).then((filePath) => {
            console.log("File saved to: ", filePath)
        })

        if (!path) {
            return NextResponse.json({ message: "File not saved" } as ResponseData, { status: 500 });
        }
        const result = await transcribeAudio()
        if (result?.statusCode === 400) {
            return NextResponse.json({ message: result.message } as ResponseData, { status: 400 });
        }
        if (result) {
            return NextResponse.json({ response: result } as ResponseData, { status: 200 });
        }
        return NextResponse.json({ message: "Hello World" } as ResponseData, { status: 200 });
    }
    catch (e) {
        console.error("ERROR: ", e)
    }

}