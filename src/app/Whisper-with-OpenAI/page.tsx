"use client";
import React, { useEffect, useState, useRef } from 'react';
import { Upload, Mic } from 'lucide-react';
import GloomyAudioPlayer from './audioPlayer';
import { Play, Pause } from 'lucide-react';
// import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import jsPDF from 'jspdf';


interface ResponseInterface {
  base64: string;
  role: string;
  transcription: string;
  keypoints: string;
}

interface Keypoint {
  point: string;
  description: string;
}

const WhisperTranscription: React.FC = () => {
  const [audioFile, setAudioFile] = useState<string | null>(null);
  const [response, setResponse] = useState<ResponseInterface[]>([]);
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    speed: number;
    opacity: number;
  }>>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [duration, setDuration] = useState<number>(0)
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [keypoints, setKeypoints] = useState<Keypoint[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [stopUpload, setStopUpload] = useState<boolean>(false)

  // Generate Particles
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = [];
      for (let i = 0; i < 100; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 2 + 1,
          speed: Math.random() * 0.2 + 0.1,
          opacity: Math.random() * 0.5 + 0.3
        });
      }
      setParticles(newParticles);
    };

    generateParticles();

    const moveParticles = setInterval(() => {
      setParticles(prev =>
        prev.map(particle => ({
          ...particle,
          y: (particle.y + particle.speed) % 100
        }))
      );
    }, 100);

    return () => clearInterval(moveParticles);
  }, []);

  // Handle Audio Upload
  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setStopUpload(true)
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      alert("Please select a valid audio file!");
      event.target.value = ""; // Clear the input field
      return;
    }

    if (file) {
      const base64String = await convertToBase64(file);
      setAudioFile(base64String);
      setResponse(prevResponse => [...prevResponse, { base64: base64String, role: "user", transcription: "", keypoints: "" }]);
    }
  };

  //Converting Audio to Base64
  const convertToBase64 = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Sending Data to API 
  // More robust extraction function with additional cleaning
  function extractJsonContent(str: string) {
    // Check if the string contains markdown code blocks
    if (str.includes("```json")) {
      // Extract content between ```json and ```
      const jsonContentMatch = str.match(/```json\n([\s\S]*?)\n```/);
      if (jsonContentMatch && jsonContentMatch[1]) {
        return jsonContentMatch[1].trim();
      }
    }

    // If the input already looks like JSON without markdown, try to clean it directly
    try {
      // Check if it can be parsed as is
      JSON.parse(str);
      return str;
    } catch (e) {
      if (e instanceof Error) {
        console.log("First parsing attempt failed, trying more cleanup:", e.message);
      }
      // Not valid JSON yet, continue with cleaning
    }

    // Try to clean the string more aggressively
    const cleaned = str
      .replace(/^\s*```json\s*/, '')  // Remove starting ```json
      .replace(/\s*```\s*$/, '')      // Remove ending ```
      .trim();                        // Remove extra whitespace

    return cleaned;
  }

  // Improved conversion function with better error handling
  function convertToJsObject(jsonStr: string) {
    try {
      // Try direct parsing first
      return JSON.parse(jsonStr);
    } catch (firstError) {
      if (firstError instanceof Error) {
        console.log("First parsing attempt failed, trying more cleanup:", firstError.message);
      }


      try {
        // Try to fix common issues
        const cleanedStr = jsonStr
          .replace(/,\s*}/g, '}')            // Remove trailing commas in objects
          .replace(/,\s*\]/g, ']')           // Remove trailing commas in arrays
          .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":') // Ensure property names are quoted
          .replace(/'/g, '"');               // Replace single quotes with double quotes

        return JSON.parse(cleanedStr);
      } catch (secondError) {
        console.error("Error parsing JSON even after cleanup:", secondError);

        // Last resort: log the problematic string for debugging
        console.log("Problematic JSON string:", jsonStr);
        return null;
      }
    }
  }

  const sendDataToAPI = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          audio: audioFile,
        })
      });

      const data = await response.json();
      if (!response.ok) {
        console.log("Error: ", data);
        return;
      }
      setIsLoading(false)

      console.log("Response: ", data);

      // Extract and parse with our improved functions
      const extractedJson = extractJsonContent(data.response.keypoints);
      // console.log("Extracted JSON string:", extractedJson);

      const formatData = convertToJsObject(extractedJson);
      console.log("FORMATTED: ", formatData);
      data.response.keypoints = [formatData.keypoints];

      setResponse(response => [...response, data.response]);
      setKeypoints(formatData.keypoints)
      setStopUpload(false)

    } catch (error) {
      if (error instanceof Error) {
        console.error("Error:", error.message);
      }
    }
  }
  // Start Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
        }

        const finalDuration = duration;
        const audioBlob = new Blob(chunks, { type: "audio/mpeg" });
        console.log(audioBlob);

        const fileName = `recording-${Date.now()}.mp3`

        const audioFile = new File([audioBlob], fileName, { type: "audio/mpeg" })

        // const base64String = await convertBlobToBase64(audioBlob);
        const base64String = await convertToBase64(audioFile);
        setAudioFile(base64String);
        setResponse(prevResponse => [...prevResponse, { base64: base64String, role: "user", transcription: "", keypoints: "", duration: finalDuration, }]);
        setDuration(0); // Reset duration
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      // Start duration timer (0.1s intervals)
      durationIntervalRef.current = setInterval(() => {
        setDuration((prevDuration) => +(prevDuration + 0.1).toFixed(1));
      }, 100);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  // Stop Recording
  const stopRecording = () => {
    setStopUpload(true)
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }
  };


  //Generate PDF with justified text
  const generatePDF = (transcript: string, keypoints: any[]) => {
    console.log("KEYPOINTS: ", keypoints)
    console.log("Generating PDF...");
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("Transcription", 20, 20);

    doc.setFontSize(12);
    let yOffset = justifyText(transcript, doc, 20, 30, 180); // Justify the transcript
    yOffset += 10; // Add space after transcript

    if (yOffset > 280) {
      doc.addPage();
      yOffset = 20;
    }

    // Keypoints Section
    doc.setFontSize(20);
    doc.text("Key Points", 20, yOffset);
    yOffset += 10;

    doc.setFontSize(12);
    const points = keypoints[1]
    console.log("POINTS:  ", points)
    keypoints.forEach((keypoint: any, index: number) => {
      console.log(keypoint)
      const title = `${index + 1}. ${keypoint.point}:`;
      doc.setFont("helvetica", "bold");
      doc.text("", 20, 5)
      doc.text(title, 20, yOffset);
      yOffset += 6;

      // Justify the keypoint description
      doc.setFont("helvetica", "normal");
      yOffset = justifyText(JSON.stringify(keypoint.description), doc, 25, yOffset, 175);
      yOffset += 4; // Add space between keypoints

      if (yOffset > 280) {
        doc.addPage();
        yOffset = 20;
      }
    });

    doc.save("transcription.pdf");
  };

  // Function to justify text and return the new Y position
  const justifyText = (text: string, doc: any, x: number, y: number, maxWidth: number) => {
    console.log("TEXT: ", text)
    const words = text.split(' ');
    console.log(words)
    let line = '';
    let lineY = y;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const testWidth = doc.getStringUnitWidth(testLine) * doc.internal.getFontSize() / doc.internal.scaleFactor;

      if (testWidth > maxWidth && i > 0) {
        // Justify this line (except last line)
        if (i < words.length - 1) {
          const lineWords = line.trim().split(' ');
          if (lineWords.length > 1) {
            const spaceWidth = (maxWidth - doc.getStringUnitWidth(line.trim()) * doc.internal.getFontSize() / doc.internal.scaleFactor) / (lineWords.length - 1);
            let xOffset = x;

            lineWords.forEach((word, index) => {
              doc.text(word, xOffset, lineY);
              if (index < lineWords.length - 1) {
                xOffset += doc.getStringUnitWidth(word + ' ') * doc.internal.getFontSize() / doc.internal.scaleFactor + spaceWidth;
              }
            });
          } else {
            doc.text(line.trim(), x, lineY);
          }
        } else {
          // Last line is left-aligned
          doc.text(line.trim(), x, lineY);
        }

        line = words[i] + ' ';
        lineY += 6; // Line height

        if (lineY > 280) {
          doc.addPage();
          lineY = 20;
        }
      } else {
        line = testLine;
      }
    }

    // Output the last line (left-aligned)
    if (line.trim() !== '') {
      doc.text(line.trim(), x, lineY);
    }

    return lineY; // Return the new Y position
  };


  //Send Data to API when audio file Changes
  useEffect(() => {
    if (audioFile) {
      console.log(audioFile)
      sendDataToAPI()
    }
  }, [audioFile])

  useEffect(() => { }, [stopUpload])


  const bottomRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    console.log("IN EFFECT: ", response)
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [response])

  useEffect(() => {
    if (keypoints) {
      console.log("IN EFFECT KEYPOINTS: ", keypoints)
    }

  }, [keypoints])


  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };







  return (
    <div className="h-screen w-screen bg-gradient-to-b from-blue-950 to-black flex flex-col overflow-hidden relative ">
      {/* Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-blue-100"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              boxShadow: `0 0 ${particle.size * 2}px ${particle.size}px rgba(59, 130, 246, 0.8)`
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="flex justify-between items-center py-8 fixed absolute z-50 bg-white/30 w-[100%] px-12 mb-12 backdrop-blur-lg ">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="22"></line>
            </svg>
          </div>
          <div className="text-2xl font-bold">
            Audio<span className="text-blue-800">Verse</span>
          </div>
        </div>
        <nav className="hidden md:block">
          <ul className="flex space-x-8">
            <li><a onClick={() => window.location.href = "/"} className="font-large hover:text-purple-500 transition-colors hover:pointer">Home</a></li>

          </ul>
        </nav>
      </header>

      {/* Conversation Container - Now with flex-grow and overflow-y-auto */}
      <main className="flex-grow flex flex-col w-full px-4 py-36 overflow-y-auto scrollbar-pretty z-10">
        <div className="space-y-6 min-h-min z-50">
          {/* Initial Whisper Message */}
          <div className="w-full mx-auto">
            <div className="bg-blue-900 bg-opacity-30 text-white p-6 rounded-xl shadow-xl border border-blue-400 shadow-blue-500/30 backdrop-blur-sm">
              <div className="flex items-center mb-4">
                <Mic className="mr-3 text-blue-200" size={30} />
                <span className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">Whisper AI</span>
              </div>
              <p className="text-blue-100">
                Upload an audio file, and I&apos;ll transcribe it for you.
              </p>
            </div>
          </div>

          {/* Uploaded Audio Responses */}
          {response.map((res, index) => (
            res.role === "user" ?
              <div key={index} className="flex justify-end w-full">
                <div className="w-3/5">
                  <GloomyAudioPlayer audioSource={res.base64 || ''} audioDuration={duration} />
                </div>
              </div>
              :
              <div key={index} className="flex justify-start w-full">
                <div className="w-3/5 bg-blue-900 bg-opacity-30 text-white p-6 rounded-xl shadow-xl border border-blue-400 shadow-blue-500/30 backdrop-blur-sm">
                  <div className="flex flex-col items-start mb-4">
                    <h1 className="text-blue-200 text-3xl font-bold mb-2">Transcript</h1>
                    <span className="flex w-full flex-end rounded font-bold text-xl bg-blue-950 bg-opacity-70 text-blue-100 p-5 border border-blue-500">
                      {res.transcription}
                    </span>
                  </div>
                  <div className="flex flex-col items-start mb-4">
                    <h1 className="text-blue-200 text-3xl font-bold mb-2">Key Points</h1>
                    <table className="w-full border-collapse border bg-gray-900 rounded-lg overflow-hidden shadow-lg">
                      <thead>
                        <tr className="bg-gray-700 border-b border-gray-600 opacity-100">
                          <th className="text-white text-xl font-bold p-4 text-left border-gray-900 border-r">Key Points</th>
                          <th className="text-white text-xl font-bold p-4 text-left">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {
                          Array.isArray(keypoints) && keypoints.map((keypoint, i) => (
                            <tr key={i} className={i % 2 === 0 ? "bg-gray-800" : "bg-gray-750 opacity-100"}>
                              <td className="text-blue-100 p-4 border-t border-gray-700 border-r">{keypoint.point}</td>
                              <td className="text-blue-100 p-4 border-t border-gray-700">{keypoint.description}</td>
                            </tr>
                          ))
                        }

                      </tbody>
                    </table>
                    <button className='bg-black m-5 p-5 rounded cursor-pointer hover:bg-white hover:text-black transition duration-300 ease-in-out' onClick={() => generatePDF(res.transcription, keypoints)}>Download PDF</button>
                  </div>
                </div>
              </div>
          ))}
          {isLoading && (
            <div className="w-[5%] bg-blue-900 bg-opacity-30 text-white p-6 rounded-xl shadow-xl border border-blue-400 shadow-blue-500/30 backdrop-blur-sm flex justify-center items-center space-x-2">

              <span className="flex space-x-1">
                <span className="animate-bounce delay-100 h-2 w-2 rounded-full bg-blue-400" style={{ animationDelay: '0ms' }}></span>
                <span className="animate-bounce delay-200 h-2 w-2 rounded-full bg-blue-400" style={{ animationDelay: '150ms' }}></span>
                <span className="animate-bounce delay-300 h-2 w-2 rounded-full bg-blue-400" style={{ animationDelay: '300ms' }}></span>
              </span>
            </div>
          )}
        </div>
      </main>

      {/* File Upload Section - Now with position fixed */}
      <footer className="w-full p-4 bg-blue-950 bg-opacity-70 backdrop-blur-sm border-t border-blue-400 z-10 flex-shrink-0">
        <div className="container mx-auto flex justify-center">
          <label
            className={`flex items-center justify-center w-full max-w-md px-2 py-4 rounded-xl transition-colors duration-300 shadow-xl border ${stopUpload
              ? "bg-blue-500 text-white opacity-50 cursor-not-allowed border-blue-300 shadow-none"
              : "bg-blue-800 text-white hover:bg-blue-700 shadow-blue-500/30 border-blue-400 cursor-pointer"
              }`}
          >
            <Upload className="mr-3 text-blue-200" size={24} />
            <span className="text-lg font-semibold">Upload Audio File</span>
            <input
              type="file"
              accept="audio/*"
              disabled={stopUpload}
              className="hidden"
              onChange={handleAudioUpload}
            />
          </label>

          <div className="m-4">
            <button
              onClick={!stopUpload ? togglePlay : undefined}
              disabled={stopUpload}
              className={`${!stopUpload ? "flex" : "opacity-50 cursor-not-allowed"
                } bg-blue-800 hover:bg-blue-700 text-white p-2 rounded-full w-10 h-10 items-center justify-center transition-colors`}
            >
              {isRecording ? <Pause size={20} onClick={stopRecording} /> : <Play size={20} onClick={startRecording} />}
            </button>
          </div>

        </div>

      </footer>
    </div>
  );
};

export default WhisperTranscription;