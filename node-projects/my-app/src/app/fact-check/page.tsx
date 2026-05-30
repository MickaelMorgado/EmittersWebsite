'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Search, Upload, Link as LinkIcon, Loader2 } from 'lucide-react';

type Verdict = 'true' | 'false' | 'uncertain' | 'mixed';

interface FactCheckResult {
  verdict: Verdict;
  summary: string;
  reasoning: string;
  confidence: number;
  sources: string[];
}

const COLORS = {
  true: 'bg-green-500/20 border-green-500 text-green-400',
  false: 'bg-red-500/20 border-red-500 text-red-400',
  uncertain: 'bg-yellow-500/20 border-yellow-500 text-yellow-400',
  mixed: 'bg-orange-500/20 border-orange-500 text-orange-400',
};

const VERDICT_ICONS = {
  true: CheckCircle,
  false: XCircle,
  uncertain: AlertTriangle,
  mixed: AlertTriangle,
};

export default function FactCheckPage() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FactCheckResult | null>(null);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!mounted) return;
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !selectedImage) return;
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/factcheck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          selectedImage
            ? { content: selectedImage, type: 'image' }
            : { content: input, type: 'text' }
        )
      });
      
      const data = await res.json();
      if (data.error) {
        if (data.error.includes('Vision') && input) {
          setError('Image upload requires OpenAI Vision API. Analyzing text instead...');
          const textRes = await fetch('/api/factcheck', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: input, type: 'text' })
          });
          const textData = await textRes.json();
          if (textData.error) throw new Error(textData.error);
          setResult(textData);
        } else {
          throw new Error(data.error);
        }
      } else {
        setResult(data);
      }
} catch (err) {
      setError('Failed to check fact. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const VerdictIcon = result ? VERDICT_ICONS[result.verdict] : null;

  return (
    <div className="min-h-screen bg-black text-white p-4 lg:p-8">
      <div className="container mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold mb-2 heading-shine uppercase">Fact Check AI</h1>
        <p className="text-zinc-400 mb-8">Upload a screenshot, paste a URL, or enter text to verify</p>

        <Card className="bg-zinc-900/50 border-zinc-800 mb-6">
          <CardContent className="pt-6 space-y-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste claim, URL, or text to fact-check..."
                className="bg-zinc-800 border-zinc-700"
              />
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </form>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" /> Upload Image
              </Button>
              <input 
                ref={fileRef} 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileChange}
              />
              {selectedImage && (
                <Button variant="outline" onClick={clearImage}>
                  Clear Image
                </Button>
              )}
            </div>
            
            {selectedImage && mounted && (
              <div className="mt-4">
                <img src={selectedImage} alt="Selected" className="max-h-48 rounded border border-zinc-700" />
              </div>
            )}
            
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </CardContent>
        </Card>

        {result && (
          <Card className={`border-2 ${COLORS[result.verdict]}`.split(' ')[0]}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {VerdictIcon && <VerdictIcon className="h-6 w-6" />}
                <span className="uppercase">{result.verdict}</span>
                <Badge variant="outline">{result.confidence}% confidence</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Summary</h3>
                <p>{result.summary}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Reasoning</h3>
                <p className="text-zinc-300 text-sm">{result.reasoning}</p>
              </div>
              {result.sources.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-1">Sources</h3>
                  <ul className="text-zinc-400 text-sm space-y-1">
                    {result.sources.map((s, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <LinkIcon className="h-3 w-3" /> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}