'use client';

import type React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Edit, Plus, Send, Trash2, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'bot';
  timestamp: Date;
}

interface Prompt {
  id: string;
  title: string;
  text: string;
  timestamp: Date;
}

interface ChatHistoryMessage {
  id: string;
  content: string;
  role: 'user' | 'bot';
  timestamp: string;
}

export default function Component() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [promptTitle, setPromptTitle] = useState('');
  const [editingPrompt, setEditingPrompt] = useState<{
    id: string;
    title: string;
    text: string;
    timestamp: Date;
  } | null>(null);
  const [savedPrompts, setSavedPrompts] = useState<
    Array<{ id: string; title: string; text: string; timestamp: Date }>
  >([]);
  const [mainInput, setMainInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const elem = document.querySelector<HTMLDivElement>(
      '[data-chatgpt-container]'
    );
    if (elem) {
      elem.scrollTop = elem.scrollHeight;
    }
  }, [chatMessages]);

  // Load prompts from localStorage on component mount
  useEffect(() => {
    const stored = localStorage.getItem('ai-chat-prompts');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSavedPrompts(
          (parsed as Prompt[]).map((p) => ({
            ...p,
            timestamp: new Date(p.timestamp),
          }))
        );
      } catch (error) {
        console.error('Error loading prompts from localStorage:', error);
      }
    }

    // Load chat history
    const storedChat = localStorage.getItem('ai-chat-history');
    if (storedChat) {
      try {
        const parsed = JSON.parse(storedChat);
        setChatMessages(
          (parsed as ChatHistoryMessage[]).map((m) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }))
        );
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    }
  }, []);

  const appendMessage = (content: string, role: 'user' | 'bot') => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      role,
      timestamp: new Date(),
    };

    setChatMessages((prev) => {
      const updated = [...prev, newMessage];
      localStorage.setItem('ai-chat-history', JSON.stringify(updated));
      return updated;
    });
  };

  const chatGPTRequest = async (message: string) => {
    try {
      setIsLoading(true);

      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: message }],
          }),
        }
      );

      if (!response.ok) throw new Error('Error with the API request.');

      const data = await response.json();
      const reply = data.choices[0].message.content;

      appendMessage(reply, 'bot');
      return reply;
    } catch (error) {
      appendMessage('Error: Unable to fetch response.', 'bot');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (prompt.trim()) {
      const newPrompt = {
        id: Date.now().toString(),
        title: promptTitle.trim() || 'Untitled Prompt',
        text: prompt.trim(),
        timestamp: new Date(),
      };

      const updatedPrompts = [newPrompt, ...savedPrompts];
      setSavedPrompts(updatedPrompts);

      localStorage.setItem('ai-chat-prompts', JSON.stringify(updatedPrompts));

      console.log('Saving prompt:', prompt);
      setPrompt('');
      setPromptTitle('');
      setIsModalOpen(false);
    }
  };

  const handleEditSave = () => {
    if (editingPrompt && prompt.trim()) {
      const updatedPrompts = savedPrompts.map((p) =>
        p.id === editingPrompt.id
          ? {
              ...p,
              title: promptTitle.trim() || 'Untitled Prompt',
              text: prompt.trim(),
            }
          : p
      );

      setSavedPrompts(updatedPrompts);
      localStorage.setItem('ai-chat-prompts', JSON.stringify(updatedPrompts));

      console.log('Updating prompt:', prompt);
      setPrompt('');
      setPromptTitle('');
      setEditingPrompt(null);
      setIsEditModalOpen(false);
    }
  };

  const handlePromptClick = (savedPrompt: {
    id: string;
    title: string;
    text: string;
    timestamp: Date;
  }) => {
    setMainInput(savedPrompt.text);
    console.log('Selected prompt:', savedPrompt.text);
  };

  const handleEditPrompt = (
    e: React.MouseEvent,
    savedPrompt: { id: string; title: string; text: string; timestamp: Date }
  ) => {
    e.stopPropagation();
    setEditingPrompt(savedPrompt);
    setPromptTitle(savedPrompt.title);
    setPrompt(savedPrompt.text);
    setIsEditModalOpen(true);
    console.log('Editing prompt:', savedPrompt.id);
  };

  const handleDeletePrompt = (e: React.MouseEvent, promptId: string) => {
    e.stopPropagation();
    const updatedPrompts = savedPrompts.filter((p) => p.id !== promptId);
    setSavedPrompts(updatedPrompts);
    localStorage.setItem('ai-chat-prompts', JSON.stringify(updatedPrompts));
    console.log('Deleted prompt:', promptId);
  };

  const handleSubmit = async () => {
    if (mainInput.trim() && !isLoading) {
      const userMessage = mainInput.trim();

      // Add user message to chat
      appendMessage(userMessage, 'user');

      // Clear input
      setMainInput('');

      // Send to ChatGPT
      await chatGPTRequest(userMessage);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const clearChat = () => {
    setChatMessages([]);
    localStorage.removeItem('ai-chat-history');
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Left Sidebar */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray flex flex-row md:flex-col">
        <div className="p-2 md:p-4 flex flex-row space-x-3 overflow-x-auto scrollbar-thin scrollbar-thumb-primary scrollbar-track-transparent">
          {/* Chat History Items */}
          {savedPrompts.length > 0 ? (
            savedPrompts.slice(0, 10).map((savedPrompt) => (
              <Card
                key={savedPrompt.id}
                className="min-w-[200px] border-2 border-primary cursor-pointer hover:border-primary/80 transition-colors relative group flex-shrink-0"
                onClick={() => handlePromptClick(savedPrompt)}
              >
                <CardContent className="p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-2">
                      <h4 className="text-sm font-semibold text-primary mb-1">
                        {savedPrompt.title}
                      </h4>
                      <p className="text-sm text-primary/80 line-clamp-3">
                        {savedPrompt.text}
                      </p>
                      <p className="text-xs text-primary/60 mt-2">
                        {savedPrompt.timestamp.toLocaleDateString()}{' '}
                        {savedPrompt.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-100 hover:text-blue-600"
                        onClick={(e) => handleEditPrompt(e, savedPrompt)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600"
                        onClick={(e) => handleDeletePrompt(e, savedPrompt.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center text-gray-500 mt-8">
              <p className="text-sm">No prompts saved yet</p>
              <p className="text-xs mt-1">
                Click the + button to add your first prompt
              </p>
            </div>
          )}
        </div>

        {/* Bottom Icons */}
        <div className="p-2 md:p-4 border-t border-gray flex justify-between items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={clearChat}
            className="hover:bg-red-100 hover:text-red-600"
            title="Clear chat history"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button
                size="icon"
                className="rounded-full bg-primary hover:bg-primary/80 text-white"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl border-2 border-primary bg-black">
              <DialogHeader className="border-b border-gray pb-4">
                <DialogTitle className="text-left">New Prompt</DialogTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-4"
                  onClick={() => setIsModalOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </DialogHeader>
              <div className="py-6 space-y-4">
                <div>
                  <label
                    htmlFor="prompt-title"
                    className="block text-sm font-medium text-primary mb-2"
                  >
                    Title
                  </label>
                  <Input
                    id="prompt-title"
                    placeholder="Enter a title for your prompt..."
                    value={promptTitle}
                    onChange={(e) => setPromptTitle(e.target.value)}
                    className="border-2 border-primary focus:border-primary/80 text-primary placeholder:text-primary/60 bg-transparent"
                  />
                </div>
                <div>
                  <label
                    htmlFor="prompt-text"
                    className="block text-sm font-medium text-primary mb-2"
                  >
                    Prompt
                  </label>
                  <Textarea
                    id="prompt-text"
                    placeholder="Place your prompt here..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[200px] border-2 border-primary focus:border-primary/80 resize-none text-primary placeholder:text-primary/60 bg-transparent"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t border-gray">
                <Button
                  onClick={handleSave}
                  className="bg-primary hover:bg-primary/80 text-white px-8"
                >
                  SAVE
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Prompt Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl border-2 border-primary bg-black">
          <DialogHeader className="border-b border-gray pb-4">
            <DialogTitle className="text-left">Edit Prompt</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingPrompt(null);
                setPrompt('');
                setPromptTitle('');
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div>
              <label
                htmlFor="edit-prompt-title"
                className="block text-sm font-medium text-primary mb-2"
              >
                Title
              </label>
              <Input
                id="edit-prompt-title"
                placeholder="Enter a title for your prompt..."
                value={promptTitle}
                onChange={(e) => setPromptTitle(e.target.value)}
                className="border-2 border-primary focus:border-primary/80 text-primary placeholder:text-primary/60 bg-transparent"
              />
            </div>
            <div>
              <label
                htmlFor="edit-prompt-text"
                className="block text-sm font-medium text-primary mb-2"
              >
                Prompt
              </label>
              <Textarea
                id="edit-prompt-text"
                placeholder="Place your prompt here..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[200px] border-2 border-primary focus:border-primary/80 resize-none text-primary placeholder:text-primary/60 bg-transparent"
              />
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-gray">
            <Button
              onClick={handleEditSave}
              className="bg-primary hover:bg-primary/80 text-white px-8"
            >
              UPDATE
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Messages Area */}
        <div
          className="flex-1 overflow-y-auto p-2 md:p-4 pb-24"
          data-chatgpt-container="true"
        >
          {chatMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center flex flex-col justify-center h-full">
                <h1 className="text-4xl font-bold text-primary tracking-wide mb-4">
                  ASK ME ANYTHING
                </h1>
                <p className="text-gray-500">
                  Start a conversation by typing a message below
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl mx-auto">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'bot' && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary text-white'
                        : 'border-2 border-primary text-primary'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap markdown-container">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    <small
                      className={`text-xs mt-2 ${
                        message.role === 'user'
                          ? 'text-primary/20'
                          : 'text-primary/60'
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </small>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="border-2 border-primary text-primary px-4 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-100"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-200"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray p-2 md:p-4 fixed bottom-0 left-0 right-0 backdrop-blur-sm md:static md:bg-transparent z-50">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <Input
                placeholder="Type your message here..."
                value={mainInput}
                onChange={(e) => setMainInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="w-full h-12 md:h-14 px-4 md:px-6 pr-12 md:pr-14 text-base md:text-lg border-2 border-primary rounded-full focus:border-primary/80"
              />
              <Button
                onClick={handleSubmit}
                disabled={!mainInput.trim() || isLoading}
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-9 w-9 md:h-10 md:w-10 rounded-full bg-primary hover:bg-primary/80 disabled:bg-gray-300 disabled:hover:bg-gray-300"
              >
                <Send className="w-4 h-4 text-white" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
