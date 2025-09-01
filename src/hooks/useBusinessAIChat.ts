import { useState, useEffect, useRef, useCallback } from 'react';

import { businessDataService } from '@/services/businessDataService';
import { createChatCompletion } from '@/services/aiService';

import type { Business, BusinessAnalytics } from '@/types/business';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

export function useBusinessAIChat(module: 'business-intelligence' | 'community-pulse') {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analytics, setAnalytics] = useState<BusinessAnalytics | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getWelcomeMessage = useCallback(() => {
    if (module === 'business-intelligence') {
      return `👋 Hi! I\'m your Business Intelligence AI assistant. I have access to Charlotte\'s business data including ${businesses.length} businesses across ${analytics?.topIndustries.length || 0} industries.\n\nI can help you analyze market trends, compare businesses, identify opportunities, and answer questions about:\n• Industry performance and benchmarks\n• Revenue and employment analytics  \n• Geographic business distribution\n• Competitive landscape analysis\n• Growth patterns and market insights\n\nWhat would you like to explore today?`;
    } else {
      return `👋 Welcome to Community Pulse AI! I\'m here to help you understand Charlotte\'s business community dynamics and trends.\n\nI can analyze:\n• Community business sentiment and engagement\n• Neighborhood economic development patterns\n• Local industry clusters and ecosystems\n• Business network connections and partnerships\n• Economic impact on different communities\n\nHow can I help you understand Charlotte\'s business community today?`;
    }
  }, [module, businesses, analytics]);

  const getSuggestedQuestions = useCallback(() => {
    if (module === 'business-intelligence') {
      return [
        "What are the top performing industries in Charlotte?",
        "Which neighborhoods have the highest business revenue?",
        "Show me companies with high revenue growth",
        "Compare average employees by industry",
        "What's the revenue distribution across business types?"
      ];
    } else {
      return [
        "What's the business sentiment in different neighborhoods?",
        "How are local businesses collaborating?",
        "Which communities show strong economic growth?",
        "Tell me about business clustering patterns",
        "What are the emerging business trends?"
      ];
    }
  }, [module]);

  const loadDataAndInitialize = useCallback(async () => {
    try {
      // Stagger the data loading to reduce blocking
      await businessDataService.ensureLoaded();
      
      // Use requestIdleCallback if available, otherwise setTimeout
      const scheduleWork = (callback: () => void) => {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(callback);
        } else {
          setTimeout(callback, 0);
        }
      };
      
      scheduleWork(async () => {
        const [analyticsData, businessData] = await Promise.all([
          businessDataService.getAnalytics(),
          businessDataService.getAllBusinesses()
        ]);
        
        setAnalytics(analyticsData);
        setBusinesses(businessData);

        const welcomeMessage: Message = {
          id: '1',
          role: 'assistant',
          content: getWelcomeMessage(),
          timestamp: new Date(),
          suggestions: getSuggestedQuestions()
        };
        setMessages([welcomeMessage]);
      });
    } catch (err) {
      console.error('Failed to load data for AI chat:', err);
    }
  }, [getWelcomeMessage, getSuggestedQuestions]);

  useEffect(() => {
    loadDataAndInitialize();
  }, [loadDataAndInitialize]);

  useEffect(() => {
    // Only scroll if there are actual messages and not on initial load
    if (messages.length > 0 && messagesEndRef.current) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  }, [messages.length]);

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    try {
      // Use the consolidated Charlotte AI Chat API
      const response = await fetch('/api/ai-chat-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: userMessage }
          ],
          module: module,
          model: 'gpt-4o-mini',
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`Charlotte AI API failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.content) {
        return data.content;
      }
      throw new Error('No content in response');
    } catch (error) {
      console.warn('Charlotte AI API failed, using fallback:', error);
      
      // Fallback to aiService with basic OpenAI integration
      const messagesPayload = [
        {
          role: 'system',
          content: module === 'business-intelligence'
            ? `You are a Charlotte Business Intelligence AI assistant. Focus on market trends and business analysis for Charlotte, NC.`
            : `You are a Charlotte Community Pulse AI assistant. Focus on community engagement and local business relationships in Charlotte, NC.`
        },
        { role: 'user', content: userMessage },
      ];

      const reply = await createChatCompletion({
        messages: messagesPayload as any,
        model: 'gpt-4o-mini',
        temperature: 0.7,
      });
      return reply.trim();
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await generateAIResponse(input.trim());
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        suggestions: Math.random() > 0.7 ? getSuggestedQuestions().slice(0, 3) : undefined
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      
      let errorContent = 'I apologize, but I encountered an error. ';
      if (error instanceof Error) {
        if (error.message.includes('authentication')) {
          errorContent += 'The API endpoint requires authentication. This is a deployment configuration issue.';
        } else if (error.message.includes('404')) {
          errorContent += 'The API endpoint was not found. Please check the deployment.';
        } else {
          errorContent += `Details: ${error.message.substring(0, 100)}`;
        }
      } else {
        errorContent += 'Please try again or ask a different question.';
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    input,
    isLoading,
    messagesEndRef,
    setInput,
    handleSendMessage
  };
}
