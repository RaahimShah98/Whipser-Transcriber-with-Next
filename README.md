Here’s your README section:

---

## Getting Started

1. **Install dependencies**  
   ```sh
   npm install
   ```
2. **Set environment variables**  
   create a .env.local file in your root directory. Add the following variables to your `.env.local` file:  
   ```
   NEXT_PUBLIC_OPENAI_API_KEY=your-api-key
   NEXT_PUBLIC_OPENAI_ASSISTANT_ID=your-assistant-id
   ```
3. **Run the project**  
   ```sh
   npm run dev
   ```

## Audio Translation & Keypoint Extraction

This project leverages **OpenAI Whisper** for **accurate audio translation** and **OpenAI Assistant** for **keypoint extraction** from transcribed text. The system enables seamless translation of spoken content and identifies essential insights, making it useful for transcription analysis, summarization, and content generation.

### Features:
- **Speech-to-Text Translation**: Uses Whisper to convert audio into text with multi-language support.
- **Keypoint Extraction**: The OpenAI Assistant processes transcribed text to highlight critical information.
- **Real-time Processing**: Supports instant analysis for efficient workflow integration.
- **User-Friendly Interface**: Simple and interactive UI for uploading and analyzing audio.

