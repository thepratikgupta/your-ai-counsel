import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, message, hasFile } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get conversation history
    const { data: messages } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    // Get uploaded documents if any
    let documentContext = '';
    if (hasFile) {
      const { data: docs } = await supabase
        .from('document_uploads')
        .select('file_name, extracted_text')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (docs && docs.length > 0 && docs[0].extracted_text) {
        documentContext = `\n\nDocument Context from ${docs[0].file_name}:\n${docs[0].extracted_text}`;
      }
    }

    // Build conversation history
    const conversationHistory = messages?.map(m => ({
      role: m.role,
      content: m.content
    })) || [];

    // Add current message
    conversationHistory.push({
      role: 'user',
      content: message + documentContext
    });

    const systemPrompt = `You are an expert legal AI advisor. Your role is to:
1. Provide clear, accurate legal guidance based on established laws and precedents
2. Format your responses with proper structure using markdown:
   - Use # for main headings
   - Use ## for subheadings
   - Use **text** for bold emphasis
   - Use *text* for italic emphasis
3. When relevant, cite specific laws, sections, or case references
4. Always include a disclaimer that this is general legal information, not legal advice
5. Be professional, thorough, and easy to understand
6. If analyzing documents, reference specific sections or content
7. Suggest 3-5 relevant legal references or judgements when applicable

After your response, provide a JSON array of relevant references with this format:
REFERENCES: ["Reference 1", "Reference 2", "Reference 3"]`;

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const responseText = aiData.choices[0].message.content;

    // Extract references if present
    let cleanResponse = responseText;
    let references: string[] = [];
    
    const referencesMatch = responseText.match(/REFERENCES:\s*(\[.*?\])/s);
    if (referencesMatch) {
      try {
        references = JSON.parse(referencesMatch[1]);
        cleanResponse = responseText.replace(/REFERENCES:\s*\[.*?\]/s, '').trim();
      } catch (e) {
        console.error('Failed to parse references:', e);
      }
    }

    // If no references provided, generate some generic ones based on legal context
    if (references.length === 0) {
      references = [
        "Indian Penal Code (IPC) - General criminal law provisions",
        "Constitution of India - Fundamental Rights and Legal Framework",
        "Code of Civil Procedure (CPC) - Civil litigation procedures"
      ];
    }

    return new Response(
      JSON.stringify({ response: cleanResponse, references }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in legal-chat function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});