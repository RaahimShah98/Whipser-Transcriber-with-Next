import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { Readable } from "stream";

type ResponseData = {
    message: string,
    response: object
}

const openAI = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const ASSITANT_ID = process.env.OPENAI_ASSISTANT_ID // or gpt-4
const ASSISTANT_NAME = "Whisper-NEXT"

let threadId: string | null = null;

// AWS S3 Configuration
const s3Client = new S3Client({
    region: process.env.AWS_REGION as string,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
});

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "whisper-with-next";

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
        if (e instanceof Error) {
            console.log("ASSITANT ERROR: ", e.message)
            return null;
        }
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


// Read mp3 file for transcription
const reading_mp3 = async () => {
    try {

        const tempDir = path.join(process.cwd(), "temp");
        // const tempDir = '/tmp';
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
        if (e instanceof Error) {
            console.log("READING MP3 ERROR: ", e.message)
            return null;
        }
    }

};

//
//
//
//
//
// USING AWS
//
//
//
//
//

const uploadToS3 = async (file: string): Promise<string> => {
    try {
        console.log("UPLOADING TO S3...");
        const base64Data = file.includes('base64,')
            ? file.split('base64,')[1]
            : file;

        const buffer = Buffer.from(base64Data, 'base64');
        const fileName = `audio-${uuidv4()}.mp3`;
        
        await s3Client.send(new PutObjectCommand({
            Bucket: S3_BUCKET_NAME,
            Key: fileName,
            Body: buffer,
            ContentType: 'audio/mpeg'
        }));
        
        console.log(`File uploaded to S3: ${fileName}`);
        return fileName;
    } catch (e) {
        if (e instanceof Error) {
            console.log("S3 UPLOAD ERROR: ", e.message);
            throw e;
        }
        throw new Error("Unknown error during S3 upload");
    }
};

// Get file from S3 for transcription
const getFileFromS3 = async (fileName: string): Promise<Buffer> => {
    try {
        console.log(`GETTING FILE FROM S3: ${fileName}`);
        
        const response = await s3Client.send(new GetObjectCommand({
            Bucket: S3_BUCKET_NAME,
            Key: fileName
        }));
        
        // Convert the readable stream to a buffer
        if (!response.Body) {
            throw new Error("No file body received from S3");
        }
        
        const stream = response.Body as Readable;
        return await streamToBuffer(stream);
    } catch (e) {
        if (e instanceof Error) {
            console.log("S3 GET FILE ERROR: ", e.message);
            throw e;
        }
        throw new Error("Unknown error getting file from S3");
    }
};

// Helper function to convert stream to buffer
const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
    return new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
};


// Transcribe the audio file using OpenAI API
const transcribeAudio = async (fileName: string) => {
    try {
        // Get file from S3
        const fileBuffer = await getFileFromS3(fileName);
        
        // Create a temporary file to use with OpenAI API
        const tempDir = './temp';
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }
        const tempFilePath = path.join(tempDir, `temp-${Date.now()}.mp3`);
        fs.writeFileSync(tempFilePath, fileBuffer);
        
        const transcription = await openAI.audio.translations.create({
            file: fs.createReadStream(tempFilePath),
            model: "whisper-1",
        });
        
        // Delete temporary file after use
        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }

        console.log(transcription.text);
        if (transcription.text.length < 1) {
            return { statusCode: 400, message: "No transcription found" };
        }

        const response = await get_response_from_assistant(transcription.text);

        return {
            transcription: transcription.text,
            keypoints: response,
            role: "assistant",
            fileName: fileName // Return the S3 fileName
        };
    }
    catch (e) {
        if (e instanceof Error) {
            console.log("TRANSCRIPTION ERROR: ", e.message);
            return { statusCode: 500, message: e.message, fileName: fileName };
        }
    }
};

const get_response_from_assistant = async (message: string) => {
    try {
        if (!threadId) {
            const thread = await openAI.beta.threads.create()
            threadId = thread.id;
        }

        await openAI.beta.threads.messages.create(threadId, {
            role: "user",
            content: message
        })
        if (!ASSITANT_ID || !threadId) {
            throw new Error("Assistant ID or Thread ID is undefined!");
        }
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
        if (error instanceof Error) {
            console.error("Error getting assistant response:", error.message);
            return null;
        }
    }
}


// Delete file from S3 if needed
const deleteFromS3 = async (fileName: string) => {
    try {
        console.log(`DELETING FILE FROM S3: ${fileName}`);
        
        await s3Client.send(new DeleteObjectCommand({
            Bucket: S3_BUCKET_NAME,
            Key: fileName,
        }));
        
        console.log(`File deleted from S3: ${fileName}`);
    } catch (e) {
        if (e instanceof Error) {
            console.log("S3 DELETE ERROR: ", e.message);
        }
    }
};


export async function POST(request: NextRequest) {

    try {
        const formData = await request.json()
        const { audio } = formData
        // console.log("FILE: ", audio)
        if (!audio) {
            return NextResponse.json({ message: "No file found" } as ResponseData, { status: 400 });
        }

        // const filePath = await temp_save_to_mp3(audio);

        const filePath = await uploadToS3(audio);

        console.log("File saved to: ", filePath);

        if (!filePath) {
            return NextResponse.json({ message: "File not saved" } as ResponseData, { status: 500 });
        }

        // Process the file
        const result = await transcribeAudio(filePath);

        // Delete the file after processing
        await deleteFromS3(filePath);
        console.log("Temporary file cleaned up");



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