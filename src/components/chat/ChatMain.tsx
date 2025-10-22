import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Paperclip, X } from "lucide-react";
import { Message } from "@/pages/Chat";
import MessageContent from "./MessageContent";

interface ChatMainProps {
  currentConversation: string | null;
  messages: Message[];
  onSendMessage: (content: string, file?: File) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const ChatMain = ({
  currentConversation,
  messages,
  onSendMessage,
  messagesEndRef,
}: ChatMainProps) => {
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if ((!input.trim() && !file) || sending) return;

    setSending(true);
    await onSendMessage(input, file || undefined);
    setInput("");
    setFile(null);
    setSending(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!currentConversation) {
    return (
      <main className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-primary">Welcome to LegalAI Advisor</h2>
          <p className="text-muted-foreground max-w-md">
            Start a new conversation to get legal guidance, analyze documents, and explore relevant case laws.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col bg-background">
      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border"
                }`}
              >
                <MessageContent content={message.content} role={message.role} />
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t border-border p-4 bg-card">
        <div className="max-w-4xl mx-auto space-y-2">
          {file && (
            <div className="flex items-center gap-2 p-2 bg-secondary rounded-lg">
              <Paperclip className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm flex-1 truncate">{file.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setFile(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
          
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
              className="hidden"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a legal question or describe your situation..."
              className="flex-1 min-h-[60px] max-h-[200px]"
              disabled={sending}
            />
            <Button
              onClick={handleSend}
              disabled={(!input.trim() && !file) || sending}
              size="icon"
              className="h-[60px]"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ChatMain;