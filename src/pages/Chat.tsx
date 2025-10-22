import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatMain from "@/components/chat/ChatMain";
import ReferencesSidebar from "@/components/chat/ReferencesSidebar";
import { Loader2 } from "lucide-react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const Chat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [references, setReferences] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setSession(session);
        setLoading(false);
        loadConversations(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadConversations = async (userId: string) => {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      toast({
        title: "Error loading conversations",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setConversations(data || []);
    }
  };

  const loadMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      toast({
        title: "Error loading messages",
        description: error.message,
        variant: "destructive",
      });
    } else {
      const typedMessages = (data || []).map(msg => ({
        ...msg,
        role: msg.role as "user" | "assistant"
      }));
      setMessages(typedMessages);
      scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleNewConversation = async () => {
    if (!session) return;

    const { data, error } = await supabase
      .from("conversations")
      .insert([
        {
          user_id: session.user.id,
          title: "New Conversation",
        },
      ])
      .select()
      .single();

    if (error) {
      toast({
        title: "Error creating conversation",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setConversations([data, ...conversations]);
      setCurrentConversation(data.id);
      setMessages([]);
      setReferences([]);
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversation(conversationId);
    loadMessages(conversationId);
  };

  const handleDeleteConversation = async (conversationId: string) => {
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", conversationId);

    if (error) {
      toast({
        title: "Error deleting conversation",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setConversations(conversations.filter((c) => c.id !== conversationId));
      if (currentConversation === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
        setReferences([]);
      }
    }
  };

  const handleSendMessage = async (content: string, file?: File) => {
    if (!currentConversation || !session) return;

    // Add user message
    const userMessage = {
      conversation_id: currentConversation,
      role: "user" as const,
      content,
    };

    const { data: savedMessage, error: messageError } = await supabase
      .from("messages")
      .insert([userMessage])
      .select()
      .single();

    if (messageError) {
      toast({
        title: "Error sending message",
        description: messageError.message,
        variant: "destructive",
      });
      return;
    }

    const typedUserMessage = {
      ...savedMessage,
      role: savedMessage.role as "user" | "assistant"
    };
    setMessages([...messages, typedUserMessage]);
    scrollToBottom();

    // Handle file upload if present
    let fileText = "";
    if (file) {
      const filePath = `${session.user.id}/${currentConversation}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("legal-documents")
        .upload(filePath, file);

      if (uploadError) {
        toast({
          title: "Error uploading file",
          description: uploadError.message,
          variant: "destructive",
        });
      } else {
        // Save file record
        await supabase.from("document_uploads").insert([
          {
            conversation_id: currentConversation,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            storage_path: filePath,
          },
        ]);
      }
    }

    // Get AI response
    try {
      const { data: aiData, error: aiError } = await supabase.functions.invoke("legal-chat", {
        body: {
          conversationId: currentConversation,
          message: content,
          hasFile: !!file,
        },
      });

      if (aiError) throw aiError;

      // Add assistant message
      const assistantMessage = {
        conversation_id: currentConversation,
        role: "assistant" as const,
        content: aiData.response,
      };

      const { data: assistantSaved } = await supabase
        .from("messages")
        .insert([assistantMessage])
        .select()
        .single();

      if (assistantSaved) {
        const typedAssistantMessage = {
          ...assistantSaved,
          role: assistantSaved.role as "user" | "assistant"
        };
        setMessages((prev) => [...prev, typedAssistantMessage]);
        
        // Update references if provided
        if (aiData.references) {
          setReferences(aiData.references);
        }

        // Update conversation title if it's the first message
        if (messages.length === 0) {
          const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
          await supabase
            .from("conversations")
            .update({ title })
            .eq("id", currentConversation);
          
          loadConversations(session.user.id);
        }
      }
      
      scrollToBottom();
    } catch (error: any) {
      toast({
        title: "Error getting AI response",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <ChatSidebar
        conversations={conversations}
        currentConversation={currentConversation}
        onNewConversation={handleNewConversation}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onSignOut={() => supabase.auth.signOut()}
      />
      <ChatMain
        currentConversation={currentConversation}
        messages={messages}
        onSendMessage={handleSendMessage}
        messagesEndRef={messagesEndRef}
      />
      <ReferencesSidebar references={references} />
    </div>
  );
};

export default Chat;