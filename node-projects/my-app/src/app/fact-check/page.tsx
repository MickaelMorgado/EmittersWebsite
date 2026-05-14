'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, AlertTriangle, Search, Upload, Link as LinkIcon, Loader2, Youtube, ExternalLink, ChevronDown, FileText } from 'lucide-react';
import { isYouTubeUrl, normalizeYouTubeUrl } from '@/lib/youtube';
import './styles.css';

type Verdict = 'true' | 'false' | 'uncertain' | 'mixed';

interface FactCheckResult {
  verdict: Verdict;
  summary: string;
  reasoning: string;
  confidence: number;
  sources: string[];
}

interface AnalyzedContent {
  youtubeTranscript?: string;
  youtubeVideoId?: string;
  youtubeTitle?: string;
  imageDescription?: string;
  originalInput: string;
  contentType: 'text' | 'image' | 'youtube';
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
  const [transcribing, setTranscribing] = useState(false);
  const [result, setResult] = useState<FactCheckResult | null>(null);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [analyzedContent, setAnalyzedContent] = useState<AnalyzedContent | null>(null);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    transcript: true,
    image: true,
    input: false,
    sources: false
  });
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
    setResult(null);
    setAnalyzedContent(null);

    try {
      const isYouTube = isYouTubeUrl(input);

      let contentToCheck = input;
      let contentType: 'text' | 'image' | 'youtube' = 'text';
      let transcriptContent = '';
      let videoId = '';
      let videoTitle = '';
      let imageDesc = '';

      if (isYouTube) {
        setTranscribing(true);
        console.log('[FactCheck] Fetching transcript for:', input);
        try {
          const transcriptRes = await fetch('/api/youtube-transcript', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: input })
          });

          const transcriptData = await transcriptRes.json();
          console.log('[FactCheck] Transcript response status:', transcriptRes.status);
          console.log('[FactCheck] Transcript response:', transcriptData);

          if (transcriptData.error) {
            throw new Error(transcriptData.error);
          }

          if (!transcriptData.transcript) {
            throw new Error('No transcript content returned');
          }

          transcriptContent = transcriptData.transcript;
          videoId = transcriptData.videoId || '';
          videoTitle = transcriptData.title || 'YouTube Video';
          contentToCheck = `YouTube Video Transcript:\n\n${transcriptData.transcript.substring(0, 4000)}`;
          contentType = 'youtube';
          console.log('[FactCheck] Transcript length:', contentToCheck.length);
        } catch (transcribeErr) {
          console.error('[FactCheck] Transcript error:', transcribeErr);
          setError(`Failed to transcribe video: ${transcribeErr instanceof Error ? transcribeErr.message : 'Unknown error'}`);
          setLoading(false);
          setTranscribing(false);
          return;
        } finally {
          setTranscribing(false);
        }
      }

      const res = await fetch('/api/factcheck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          selectedImage
            ? { content: selectedImage, type: 'image' }
            : { content: contentToCheck, type: contentType }
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
          setAnalyzedContent({
            originalInput: input,
            contentType: 'text'
          });
        } else {
          throw new Error(data.error);
        }
      } else {
        setResult(data);
        setAnalyzedContent({
          youtubeTranscript: transcriptContent,
          youtubeVideoId: videoId,
          youtubeTitle: videoTitle,
          imageDescription: selectedImage ? data.imageDescription : undefined,
          originalInput: input,
          contentType: selectedImage ? 'image' : contentType
        });
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

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const CollapsibleContent = ({
    title,
    section,
    content,
    isUrl = false
  }: {
    title: string;
    section: string;
    content: string;
    isUrl?: boolean
  }) => {
    const isExpanded = expandedSections[section];
    return (
      <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg overflow-hidden card-hover">
        <button
          onClick={() => toggleSection(section)}
          className="w-full flex items-center justify-between p-3 hover:bg-zinc-700/50 transition-colors button-hover"
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-400" />
            <span className="font-semibold text-sm">{title}</span>
          </div>
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>
        {isExpanded && (
          <div className="border-t border-zinc-700 p-3 bg-zinc-900/50 max-h-96 overflow-y-auto collapsible-expand fact-check-scrollable">
            {isUrl ? (
              <a
                href={content}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline break-all text-sm flex items-center gap-2"
              >
                {content}
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
              </a>
            ) : (
              <p className="text-zinc-300 text-sm whitespace-pre-wrap break-words font-mono">
                {content}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  const VerdictIcon = result ? VERDICT_ICONS[result.verdict] : null;
  const isYouTubeInput = isYouTubeUrl(input);

  return (
    <div className="fact-check-container min-h-screen bg-black text-white flex flex-col">
      <div className="w-full px-4 lg:px-8 py-6 lg:py-8 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 heading-shine uppercase">Fact Check AI</h1>
        <p className="text-zinc-400 mb-8">Paste a YouTube URL, claim, URL, or text to verify</p>

        <Card className="bg-zinc-900/50 border-zinc-800 mb-6 card-hover">
          <CardContent className="pt-6 space-y-4">
            <div className="flex gap-2 items-start">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleSubmit(e as unknown as React.FormEvent);
                  }
                }}
                placeholder="Paste YouTube URL or claim to fact-check... (Ctrl+Enter to submit)"
                className="bg-zinc-800 border-zinc-700 min-h-[80px] resize-y input-focus"
                rows={3}
              />
              <Button
                onClick={() => handleSubmit({ preventDefault: () => {} } as unknown as React.FormEvent)}
                disabled={loading || transcribing}
                className={`mt-0 h-auto button-hover transition-all ${loading || transcribing ? 'opacity-75' : ''}`}
              >
                {loading || transcribing ? (
                  <Loader2 className="h-4 w-4 animate-spin-custom" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {isYouTubeInput && mounted && (
              <div className="flex items-center gap-2 text-yellow-400 text-sm">
                <Youtube className="h-4 w-4" />
                YouTube URL detected - will fetch transcript for analysis
              </div>
            )}
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => fileRef.current?.click()} className="button-hover">
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
                <Button variant="outline" onClick={clearImage} className="button-hover fade-enter">
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
            
            {transcribing && (
              <div className="flex items-center gap-2 text-yellow-400 fade-enter">
                <Loader2 className="h-4 w-4 animate-spin-custom" />
                Fetching YouTube transcript...
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="flex-1 w-full px-4 lg:px-8 py-6 lg:py-8">
          <div className="w-full flex gap-6 h-full">
            {/* Main Content - Full Width */}
            <div className="flex-1">
              {/* Verdict Card */}
              <Card className={`border-2 ${COLORS[result.verdict]} card-hover verdict-card-animate`.split(' ')[0]}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    {VerdictIcon && <VerdictIcon className="h-6 w-6" />}
                    <span className="uppercase">{result.verdict}</span>
                    <Badge variant="outline">{result.confidence}% confidence</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2 text-lg">Summary</h3>
                    <p className="text-zinc-200">{result.summary}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-lg">Reasoning</h3>
                    <p className="text-zinc-300 leading-relaxed">{result.reasoning}</p>
                  </div>
                  {result.sources.length > 0 && (
                    <div className="pt-4 border-t border-zinc-700">
                      <div className="flex items-center gap-2 text-cyan-400 text-sm">
                        <LinkIcon className="h-4 w-4" />
                        <span>{result.sources.length} source(s) in sidebar →</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Annexed Content & Sources - Always Visible */}
            <div className="w-96 flex-shrink-0 flex flex-col gap-4">
              <div className="fact-check-sidebar-content space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {/* Annexed Content Card */}
                  {analyzedContent && (
                    <Card className="bg-zinc-900/50 border-zinc-800 card-hover sidebar-card-animate">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4 text-amber-400 flex-shrink-0" />
                          <span>Content</span>
                          <Badge variant="outline" className="ml-auto text-xs">data</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {/* YouTube Transcript */}
                        {analyzedContent.youtubeTranscript && (
                          <CollapsibleContent
                            title={`Transcript`}
                            section="transcript"
                            content={analyzedContent.youtubeTranscript}
                          />
                        )}

                        {/* Original Input */}
                        {analyzedContent.contentType !== 'image' && (
                          <CollapsibleContent
                            title="Input"
                            section="input"
                            content={analyzedContent.originalInput}
                          />
                        )}

                        {/* Image Description */}
                        {analyzedContent.imageDescription && (
                          <CollapsibleContent
                            title="Image"
                            section="image"
                            content={analyzedContent.imageDescription}
                          />
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Sources Card */}
                  {result.sources.length > 0 && (
                    <Card className="bg-zinc-900/50 border-zinc-800 card-hover sidebar-card-animate">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <LinkIcon className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                          <span>Sources</span>
                          <Badge variant="outline" className="ml-auto text-xs">{result.sources.length}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {result.sources.map((s, i) => {
                          const isUrl = s.startsWith('http://') || s.startsWith('https://');
                          let domainName = s;
                          try {
                            const url = new URL(s);
                            domainName = url.hostname.replace('www.', '');
                          } catch {
                            domainName = `Source ${i + 1}`;
                          }
                          return (
                            <div key={i} className="flex items-center gap-2 p-2 bg-zinc-900/30 rounded border border-zinc-700/50 hover:border-cyan-500/50 transition-colors button-hover">
                              <LinkIcon className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                              <a
                                href={s}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 text-blue-400 hover:text-blue-300 text-sm truncate transition-colors"
                                title={s}
                              >
                                {domainName}
                              </a>
                              <ExternalLink className="h-3 w-3 text-cyan-400/60 flex-shrink-0" />
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}