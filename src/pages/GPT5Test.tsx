import { useState } from "react";
import { useGPT5Chat } from "@/hooks/useGPT5Chat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Sparkles,
  Brain,
  MessageSquare,
  Zap,
  Database,
  TrendingUp,
  Settings,
  Send,
  RotateCcw,
  FileText,
} from "lucide-react";

export function GPT5Test() {
  const [selectedModel, setSelectedModel] = useState<"gpt-5" | "gpt-5-pro">(
    "gpt-5",
  );
  const [enableStreaming, setEnableStreaming] = useState(true);
  const [enableMemory, setEnableMemory] = useState(true);

  const {
    messages,
    input,
    isLoading,
    sessionId,
    conversationSummary,
    messagesEndRef,
    setInput,
    handleSendMessage,
    summarizeCurrentConversation,
    clearConversation,
  } = useGPT5Chat({
    model: selectedModel,
    enableStreaming,
    enableMemory,
    module: "business-intelligence",
  });

  return (
    <div className="min-h-screen bg-midnight-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
            <Brain className="h-10 w-10 text-sapphire-400" />
            GPT-5 Integration Test
          </h1>
          <p className="text-gray-400">
            Testing advanced AI capabilities with conversation memory and deep
            analysis
          </p>
        </div>

        {/* Status Bar */}
        <Card variant="glass" className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <Badge variant="success" className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {selectedModel.toUpperCase()}
                </Badge>
                <Badge variant={enableMemory ? "secondary" : "outline"}>
                  <Database className="h-3 w-3 mr-1" />
                  Memory: {enableMemory ? "ON" : "OFF"}
                </Badge>
                <Badge variant={enableStreaming ? "warning" : "secondary"}>
                  <Zap className="h-3 w-3 mr-1" />
                  Streaming: {enableStreaming ? "ON" : "OFF"}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">
                  Session: {sessionId.slice(0, 12)}...
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Panel */}
          <div className="lg:col-span-1">
            <Card variant="glass" className="mb-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Model
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) =>
                      setSelectedModel(e.target.value as "gpt-5" | "gpt-5-pro")
                    }
                    className="w-full p-2 bg-midnight-800 border border-midnight-700 rounded-lg"
                  >
                    <option value="gpt-5">GPT-5</option>
                    <option value="gpt-5-pro">
                      GPT-5 Pro (Extended Reasoning)
                    </option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={enableStreaming}
                      onChange={(e) => setEnableStreaming(e.target.checked)}
                      className="rounded border-midnight-700"
                    />
                    <span className="text-sm">Enable Streaming</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={enableMemory}
                      onChange={(e) => setEnableMemory(e.target.checked)}
                      className="rounded border-midnight-700"
                    />
                    <span className="text-sm">Enable Memory</span>
                  </label>
                </div>

                <div className="pt-4 space-y-2">
                  <Button
                    onClick={summarizeCurrentConversation}
                    disabled={isLoading || messages.length < 3}
                    className="w-full"
                    variant="secondary"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Summarize Conversation
                  </Button>

                  <Button
                    onClick={clearConversation}
                    disabled={isLoading}
                    className="w-full"
                    variant="outline"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Clear Conversation
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Analytics */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Session Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Messages:</span>
                    <span>{messages.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Model:</span>
                    <span>{selectedModel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Context Length:</span>
                    <span>
                      {messages.reduce((acc, m) => acc + m.content.length, 0)}{" "}
                      chars
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card variant="glass" className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  GPT-5 Chat
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.role === "user"
                            ? "bg-sapphire-900/50 border border-sapphire-800"
                            : message.role === "system"
                              ? "bg-yellow-900/20 border border-yellow-800"
                              : "bg-midnight-800 border border-midnight-700"
                        }`}
                      >
                        <div className="text-xs text-gray-400 mb-1">
                          {message.role === "assistant" && "GPT-5"}
                          {message.role === "user" && "You"}
                          {message.role === "system" && "System"}
                          {message.streaming && " (streaming...)"}
                        </div>
                        <div className="whitespace-pre-wrap">
                          {message.content}
                        </div>

                        {message.suggestions && (
                          <div className="mt-3 pt-3 border-t border-midnight-700">
                            <div className="text-xs text-gray-400 mb-2">
                              Suggested follow-ups:
                            </div>
                            <div className="space-y-1">
                              {message.suggestions.map((suggestion, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setInput(suggestion)}
                                  className="block w-full text-left text-sm p-2 bg-midnight-900/50 hover:bg-midnight-900 rounded transition-colors"
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isLoading && !messages[messages.length - 1]?.streaming && (
                    <div className="flex justify-start">
                      <div className="bg-midnight-800 border border-midnight-700 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="animate-pulse">
                            Thinking with GPT-5...
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Ask GPT-5 anything..."
                    disabled={isLoading}
                    className="flex-1 p-3 bg-midnight-800 border border-midnight-700 rounded-lg focus:outline-none focus:border-sapphire-500"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || !input.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Summary Display */}
            {conversationSummary && (
              <Card variant="glass" className="mt-4">
                <CardHeader>
                  <CardTitle className="text-sm">
                    Conversation Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-400">{conversationSummary}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
