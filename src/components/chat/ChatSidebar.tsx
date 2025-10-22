import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, MessageSquare, Trash2, LogOut, Scale } from "lucide-react";
import { Conversation } from "@/pages/Chat";

interface ChatSidebarProps {
  conversations: Conversation[];
  currentConversation: string | null;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onSignOut: () => void;
}

const ChatSidebar = ({
  conversations,
  currentConversation,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  onSignOut,
}: ChatSidebarProps) => {
  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <Scale className="w-6 h-6 text-primary" />
          <h1 className="text-lg font-bold text-primary">LegalAI</h1>
        </div>
        <Button onClick={onNewConversation} className="w-full" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group relative flex items-center gap-2 p-3 rounded-lg cursor-pointer hover:bg-secondary transition-colors ${
                currentConversation === conv.id ? "bg-secondary" : ""
              }`}
              onClick={() => onSelectConversation(conv.id)}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
              <span className="text-sm truncate flex-1">{conv.title}</span>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation(conv.id);
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-border">
        <Button onClick={onSignOut} variant="outline" className="w-full" size="sm">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
};

export default ChatSidebar;