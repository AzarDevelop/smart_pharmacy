import React, { useState } from "react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { MicIcon, SquareIcon } from "lucide-react";

export interface SpeechInputProps {
  onTranscript?: (text: string) => void;
  onTranscriptionChange?: (text: string) => void;
  className?: string;
  [key: string]: any;
}

export function SpeechInput({ onTranscript, onTranscriptionChange, className = "", ...props }: SpeechInputProps) {
  const [isListening, setIsListening] = useState(false);
  const handleTranscript = onTranscriptionChange || onTranscript;

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleTranscript?.(transcript);
      };
      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  return (
    <Button
      type="button"
      size="icon-sm"
      variant="ghost"
      onClick={toggleListening}
      className={cn("rounded-full", isListening && "text-red-500 animate-pulse", className)}
      {...props}
    >
      {isListening ? <SquareIcon className="w-4 h-4" /> : <MicIcon className="w-4 h-4" />}
    </Button>
  );
}
