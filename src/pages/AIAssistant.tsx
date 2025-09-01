import { MessageSquare } from "lucide-react";

import { Badge } from "@/components/ui/Badge";

export function AIAssistant() {
  return (
    <div className="p-6">
      <div className="text-center py-20">
        <MessageSquare className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
        <h1 className="text-3xl font-bold mb-4">AI Assistant</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Intelligent chatbot with RAG pipeline coming soon. Ask questions about
          local businesses and economic data.
        </p>
        <Badge variant="outline" className="mt-4">
          Coming Soon
        </Badge>
      </div>
    </div>
  );
}
export default AIAssistant;
