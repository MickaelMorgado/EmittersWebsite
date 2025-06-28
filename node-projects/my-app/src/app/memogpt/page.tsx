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
import { Clock, Plus, Send, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Component() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [promptTitle, setPromptTitle] = useState('');
  const [savedPrompts, setSavedPrompts] = useState<
    Array<{ id: string; title: string; text: string; timestamp: Date }>
  >([]);
  const [mainInput, setMainInput] = useState('');

  // Load prompts from localStorage on component mount
  useEffect(() => {
    const stored = localStorage.getItem('ai-chat-prompts');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSavedPrompts(
          parsed.map((p: any) => ({
            ...p,
            timestamp: new Date(p.timestamp),
          }))
        );
      } catch (error) {
        console.error('Error loading prompts from localStorage:', error);
      }
    }
  }, []);

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

      // Save to localStorage
      localStorage.setItem('ai-chat-prompts', JSON.stringify(updatedPrompts));

      console.log('Saving prompt:', prompt);
      setPrompt('');
      setPromptTitle('');
      setIsModalOpen(false);
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

  const handleDeletePrompt = (e: React.MouseEvent, promptId: string) => {
    e.stopPropagation(); // Prevent triggering the card click
    const updatedPrompts = savedPrompts.filter((p) => p.id !== promptId);
    setSavedPrompts(updatedPrompts);
    localStorage.setItem('ai-chat-prompts', JSON.stringify(updatedPrompts));
    console.log('Deleted prompt:', promptId);
  };

  const handleSubmit = () => {
    if (mainInput.trim()) {
      console.log('Submitting:', mainInput.trim());
      // Here you would typically send the prompt to your AI service
      // For now, we'll just clear the input
      setMainInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left Sidebar */}
      <div className="w-64 border-r border-gray flex flex-col">
        <div className="p-4 space-y-3 flex-1 overflow-y-auto">
          {/* Chat History Items */}
          {savedPrompts.length > 0 ? (
            savedPrompts.slice(0, 10).map((savedPrompt) => (
              <Card
                key={savedPrompt.id}
                className="border-2 border-teal-400 cursor-pointer hover:border-teal-500 transition-colors relative group"
                onClick={() => handlePromptClick(savedPrompt)}
              >
                <CardContent className="p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-2">
                      <h4 className="text-sm font-semibold text-teal-800 mb-1">
                        {savedPrompt.title}
                      </h4>
                      <p className="text-sm text-teal-700 line-clamp-2">
                        {savedPrompt.text}
                      </p>
                      <p className="text-xs text-teal-500 mt-2">
                        {savedPrompt.timestamp.toLocaleDateString()}{' '}
                        {savedPrompt.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600"
                      onClick={(e) => handleDeletePrompt(e, savedPrompt.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center text-gray mt-8">
              <p className="text-sm">No prompts saved yet</p>
              <p className="text-xs mt-1">
                Click the + button to add your first prompt
              </p>
            </div>
          )}
        </div>

        {/* Bottom Icons */}
        <div className="p-4 border-t border-gray flex justify-between items-center">
          <Clock className="w-6 h-6 text-gray" />
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button
                size="icon"
                className="w-full flex items-center justify-center gap-2 rounded-lg py-2 px-4"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl border-2 border-primary bg-black">
              <DialogHeader className="border-b border-gray pb-4">
                <DialogTitle className="text-left">New Prompt</DialogTitle>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-4 top-4 bg-transparent"
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
                    className="border-2 border-primary focus:border-primary/80 text-foreground placeholder:text-muted-foreground"
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
                    className="min-h-[200px] border-2 border-primary focus:border-primary/80 resize-none text-foreground placeholder:text-muted-foreground"
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-8 max-w-2xl w-full">
          <h1 className="text-4xl font-bold text-primary tracking-wide">
            ASK ME ANYTHING
          </h1>

          <div className="relative">
            <Input
              placeholder="Type your question here..."
              value={mainInput}
              onChange={(e) => setMainInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full h-14 px-6 pr-14 text-lg border-2 border-primary rounded-full focus:border-primary/80"
            />
            <Button
              onClick={handleSubmit}
              disabled={!mainInput.trim()}
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 rounded-full bg-primary hover:bg-primary/80 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
