"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { transcribeAudio, type TranscribeAudioInput } from "@/ai/flows/transcribe-audio";
import { Loader2, UploadCloud, Download, Mic2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function TranscribePage() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioDataUri, setAudioDataUri] = useState<string | null>(null);
  const [transcribedText, setTranscribedText] = useState<string>("");
  const [editedText, setEditedText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (audioFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAudioDataUri(e.target?.result as string);
      };
      reader.onerror = () => {
        setError("Failed to read the audio file.");
        toast({
          variant: "destructive",
          title: "File Read Error",
          description: "Could not read the selected audio file.",
        });
        setAudioDataUri(null);
      }
      reader.readAsDataURL(audioFile);
    } else {
      setAudioDataUri(null);
    }
  }, [audioFile, toast]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("audio/")) {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Please upload a valid audio file (e.g., MP3, WAV, M4A, OGG).",
        });
        setAudioFile(null);
        event.target.value = ""; 
        return;
      }
      // Optional: Check file size limit (e.g., 25MB)
      // const maxSize = 25 * 1024 * 1024; // 25MB
      // if (file.size > maxSize) {
      //   toast({
      //     variant: "destructive",
      //     title: "File Too Large",
      //     description: `Please upload an audio file smaller than ${maxSize / (1024*1024)}MB.`,
      //   });
      //   setAudioFile(null);
      //   event.target.value = ""; 
      //   return;
      // }
      setAudioFile(file);
      setTranscribedText("");
      setEditedText("");
      setError(null);
    }
  };

  const handleTranscribe = async () => {
    if (!audioDataUri) {
      toast({
        variant: "destructive",
        title: "No Audio File",
        description: "Please select an audio file to transcribe.",
      });
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const input: TranscribeAudioInput = { audioDataUri };
      const result = await transcribeAudio(input);
      setTranscribedText(result.transcription);
      setEditedText(result.transcription);
      toast({
        title: "Transcription Successful",
        description: "Your audio has been transcribed.",
      });
    } catch (err) {
      console.error("Transcription error:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during transcription.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Transcription Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!editedText && !transcribedText) { // Check both in case editedText was cleared
      toast({
        title: "Nothing to Download",
        description: "There is no text to download.",
      });
      return;
    }
    const textToDownload = editedText || transcribedText;
    const element = document.createElement("a");
    const file = new Blob([textToDownload], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `${audioFile?.name.split('.')[0]}_transcription.txt` || "transcription.txt";
    document.body.appendChild(element); 
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href); // Clean up
    toast({
      title: "Download Started",
      description: `${element.download} is being downloaded.`,
    });
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 md:p-8 selection:bg-primary/30 selection:text-primary-foreground">
      <Card className="w-full max-w-2xl shadow-2xl rounded-xl">
        <CardHeader className="text-center p-6 sm:p-8">
          <div className="flex justify-center items-center mb-4">
            <Mic2 className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">TranscribeAI</CardTitle>
          <CardDescription className="text-md text-muted-foreground mt-1">
            Upload your audio, get it transcribed by AI, then edit and download.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6 sm:p-8">
          <div className="space-y-2">
            <Label htmlFor="audio-upload" className="text-base font-medium">Upload Audio File</Label>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <Input
                id="audio-upload"
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="flex-grow file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                disabled={isLoading}
                aria-label="Upload audio file"
              />
              <Button
                onClick={handleTranscribe}
                disabled={!audioFile || isLoading}
                className="w-full sm:w-auto min-w-[140px] transition-all duration-150 ease-in-out"
                size="lg"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <UploadCloud className="mr-2 h-5 w-5" />
                )}
                {isLoading ? "Transcribing..." : "Transcribe"}
              </Button>
            </div>
            {audioFile && !isLoading && <p className="text-sm text-muted-foreground pt-1">Selected: {audioFile.name}</p>}
          </div>

          {error && (
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {(isLoading && !transcribedText && !error) && ( // Show loading placeholder only if no prior text and no error
            <div className="flex flex-col items-center justify-center space-y-2 p-4 border border-dashed rounded-lg min-h-[100px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Transcription in progress... Please wait.</p>
            </div>
          )}

          {/* Show Textarea if there's text OR if it's not loading (i.e. initial state or after error) */}
          {(!isLoading || transcribedText || editedText) && (
            <div className="space-y-2">
              <Label htmlFor="transcription-text" className="text-base font-medium">Transcription Result</Label>
              <Textarea
                id="transcription-text"
                placeholder={
                  isLoading && !(transcribedText || editedText)
                    ? "Transcription in progress... Please wait." 
                    : (transcribedText || editedText)
                      ? "Edit your transcription here..."
                      : "Your transcribed text will appear here once an audio file is processed."
                }
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={12}
                className="text-sm leading-relaxed resize-y min-h-[200px] focus:ring-2 focus:ring-primary/50"
                disabled={isLoading && !(transcribedText || editedText)} // Disable if loading AND no prior text
                aria-label="Transcription text area"
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end p-6 sm:p-8">
          <Button
            onClick={handleDownload}
            disabled={(!editedText && !transcribedText) || isLoading}
            variant="outline"
            className="min-w-[140px]"
            size="lg"
          >
            <Download className="mr-2 h-5 w-5" />
            Download .txt
          </Button>
        </CardFooter>
      </Card>
      <footer className="mt-12 mb-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} TranscribeAI. All rights reserved.</p>
        <p>Powered by Firebase Genkit & Next.js</p>
      </footer>
    </main>
  );
}
