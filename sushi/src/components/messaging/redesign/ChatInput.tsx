import React, { useState } from "react";
import { Smile, Paperclip, MoreHorizontal, Send, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onAttachFile?: () => void;
}

export function ChatInput({ onSendMessage, onAttachFile }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  return (
    <div className="p-4 bg-background border-t">
      <div className="flex items-center gap-2 max-w-6xl mx-auto">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <Smile className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={onAttachFile}>
            <Mic className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 relative">
          <Input
            placeholder="Type your message here..."
            className="w-full bg-muted/50 border-none rounded-2xl h-11 px-4 focus-visible:ring-1 focus-visible:ring-primary/20"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          />
        </div>

        <Button 
          size="icon" 
          className="h-11 w-11 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 active:scale-95 transition-all"
          onClick={handleSend}
          disabled={!message.trim()}
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
