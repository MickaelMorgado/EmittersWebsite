// Required packages: npm install ollama express socket.io

const { Ollama } = require('ollama');
const express = require('express');
const { exec } = require('child_process');
const { createServer } = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const ollama = new Ollama();
const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const PORT = 3001;
const MEMORY_BANK_DIR = path.join(__dirname, 'memory-bank');

let isProcessing = false;

// Memory Bank Functions
function loadMemoryFiles() {
    const memoryFiles = {};
    try {
        if (fs.existsSync(MEMORY_BANK_DIR)) {
            const files = fs.readdirSync(MEMORY_BANK_DIR);
            files.forEach(file => {
                if (file.endsWith('.md') || file.endsWith('.txt')) {
                    const filePath = path.join(MEMORY_BANK_DIR, file);
                    const content = fs.readFileSync(filePath, 'utf8');
                    const key = path.parse(file).name;
                    memoryFiles[key] = content;
                }
            });
        }
    } catch (error) {
        console.error('Error loading memory files:', error);
    }
    return memoryFiles;
}

function findRelevantMemories(userInput, memoryFiles) {
    const relevantMemories = [];
    const input = userInput.toLowerCase();

    const keywordMap = {
        personality: ['who are you', 'personality', 'character', 'about you'],
        capabilities: ['what can you do', 'skills', 'abilities', 'expertise', 'programming'],
        projects: ['project', 'development', 'code', 'application', 'work'],
        finances: ['finance', 'money', 'invest', 'stock', 'market', 'saving', 'budget', 'wealth', 'retirement', 'debt', 'crypto', 'bitcoin', 'politics', 'government', 'election']
    };

    Object.keys(keywordMap).forEach(memoryKey => {
        const keywords = keywordMap[memoryKey];
        const hasRelevantKeyword = keywords.some(keyword => input.includes(keyword));

        if (hasRelevantKeyword && memoryFiles[memoryKey]) {
            relevantMemories.push({
                key: memoryKey,
                content: memoryFiles[memoryKey],
                relevance: 1
            });
        }
    });

    if (memoryFiles.personality && !relevantMemories.find(m => m.key === 'personality')) {
        relevantMemories.push({
            key: 'personality',
            content: memoryFiles.personality,
            relevance: 0.5
        });
    }

    return relevantMemories.sort((a, b) => b.relevance - a.relevance);
}

function buildMemoryContext(relevantMemories) {
    if (relevantMemories.length === 0) return '';
    let context = '\n\nMEMORY CONTEXT:\n';
    relevantMemories.forEach(memory => {
        context += `--- ${memory.key.toUpperCase()} ---\n${memory.content}\n\n`;
    });
    return context;
}

// Realistic Piper TTS (Offline Neural Voice)
function speak(text) {
    return new Promise((resolve) => {
        // Sanitize text - aggressively remove emojis, math symbols, and other non-speech unicode
        const sanitizedText = text
            .replace(/\*/g, '') // Remove all asterisks
            .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2B50}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23EC}]|[\u{23F0}]|[\u{23F3}]/gu, '')
            .replace(/[^\x00-\x7F]/g, "") // Remove remaining non-ASCII characters to be safe for CLI
            .trim();
        
        console.log('Using Realistic Piper TTS:', sanitizedText);

        const { spawn } = require('child_process');
        const pythonProcess = spawn('python', ['tts_piper.py', sanitizedText], { cwd: __dirname });

        pythonProcess.on('close', (code) => {
            if (code !== 0) console.error(`Piper TTS process exited with code ${code}`);
            resolve();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Piper TTS Error: ${data}`);
        });
    });
}

// Cross-platform speech recognition
async function recognizeSpeech() {
    return new Promise((resolve) => {
        const command = 'python speech_recog.py';
        exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
            if (error) {
                console.error('Speech Recognition Error:', error);
                resolve('');
            } else {
                resolve(stdout.trim());
            }
        });
    });
}

let conversationHistory = [];

// Clean up raw Speech-to-Text output using AI
async function correctSTT(text) {
    if (!text || text.length < 5) return text;
    try {
        const prompt = `[INST] <<SYS>>
You are a text transformation tool. Correct spelling and grammar. 
Output ONLY the corrected text. Do not add any greeting or labels.

Example:
Input: "hello how are you doing today"
Output: "Hello, how are you doing today?"

Input: "i like the code you made its very good"
Output: "I like the code you made; it's very good."
<</SYS>>

Input: "${text}" [/INST]`;

        let corrected = '';
        const stream = await ollama.generate('llama2:7b', prompt);
        for await (const token of stream) {
            corrected += token;
        }
        
        // Post-process to aggressively remove common AI filler
        let final = corrected
            .replace(/^.*?(Corrected|Transcript|Text|Output|Result|Assistant|AI).*?:\s*/i, '') 
            .replace(/^(Sure!|Here is|Sure,|I have).*?\s/i, '')
            .replace(/["]+/g, '') 
            .trim();
            
        console.log(`[AI-Correction] "${text}" -> "${final}"`);
        return final;
    } catch (error) {
        console.error('STT Correction Error:', error);
        return text;
    }
}

// AI generation
async function askOllama(userText) {
    try {
        const memoryFiles = loadMemoryFiles();
        const relevantMemories = findRelevantMemories(userText, memoryFiles);
        const memoryContext = buildMemoryContext(relevantMemories);
        
        // Format history for the prompt
        const historyContext = conversationHistory.length > 0 
            ? `\nRECENT CONVERSATION:\n${conversationHistory.map(h => `${h.role}: ${h.text}`).join('\n')}\n`
            : '';

        // Standard Llama-2 Chat Format for better instruction following
        const sysPrompt = `You are a pragmatic developer AI for a TikTok stream. 
Personality context: ${memoryFiles.personality || ''}
${historyContext}
Rules: 
- Respond with MAX 1 short sentence (12 words).
- Address the user.
- NEVER repeat the user's message.
- Provide a unique, helpful reaction or answer.
- NO emojis. Plain text only.`;

        const prompt = `[INST] <<SYS>>\n${sysPrompt}\n<</SYS>>\n\n${userText} [/INST]`;

        let fullResponse = '';
        const stream = await ollama.generate('llama2:7b', prompt);
        for await (const token of stream) {
            fullResponse += token;
        }
        
        // Clean up any lingering "Assistant:" or tags if the model halucinates them
        let cleaned = fullResponse.replace(/Assistant:/i, '').replace(/\[\/INST\]/g, '').trim();
        
        // Update history: Keep only last 6 exchanges (User + AI pairs)
        conversationHistory.push({ role: 'User', text: userText });
        conversationHistory.push({ role: 'AI', text: cleaned });
        if (conversationHistory.length > 12) { // 6 pairs = 12 items
            conversationHistory = conversationHistory.slice(-12);
        }

        return cleaned;
    } catch (error) {
        console.error('Ollama Error:', error);
        return 'I had a glitch processing that.';
    }
}

let lastInteractionTime = Date.now();
let nextProactiveDelay = 90000; // Default 90s

function resetInactivityTimer() {
    lastInteractionTime = Date.now();
    // Random delay between 60s and 240s (1-4 minutes)
    nextProactiveDelay = Math.floor(Math.random() * (240000 - 60000 + 1) + 60000);
}


// Centralized AI Processing function
async function processAIRequest(input, source = 'voice') {
    if (isProcessing) return;
    isProcessing = true;

    try {
        console.log(`Processing ${source} input: "${input}"`);
        
        // Processing phase
        io.emit('speech_end'); // Signals visual "processing" state
        const aiResponse = await askOllama(input);
        console.log(`AI Response: ${aiResponse}`);

        // Speaking phase
        io.emit('ai_response', aiResponse);
        io.emit('ai_response_start'); // Signals visual "speaking" state
        await speak(aiResponse);
        io.emit('ai_response_end'); // Signals back to visual "idle" state
    } catch (error) {
        console.error('Error processing AI request:', error);
    } finally {
        isProcessing = false;
        resetInactivityTimer(); // Reset only after full process (including speech) is done
        io.emit('idle');
    }
}

async function main() {
    console.log(`React visual available at: http://localhost:3000/tiktok-tts`);
    console.log(`Voice server running on port: ${PORT}`);

    server.listen(PORT, () => {
        console.log(`Voice server running at http://localhost:${PORT}`);
    });

    io.on('connection', (socket) => {
        console.log('Browser connected to visual interface');
        
        socket.on('message', async (text) => {
            console.log(`[SOCKET] Received "message": "${text}" | isProcessing: ${isProcessing}`);
            if (!isProcessing) {
                await processAIRequest(text, 'text');
            } else {
                console.log('[SOCKET] Already processing, message rejected.');
            }
        });

        socket.on('speak', async (text) => {
            console.log(`[SOCKET] Received "speak": "${text}"`);
            await speak(text);
            resetInactivityTimer(); // Reset only after speaking is finished
        });
    });

    // Voice conversation loop
    while (true) {
        if (isProcessing) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
        }

        const now = Date.now();
        if (now - lastInteractionTime > nextProactiveDelay) {
            console.log('--- Proactive Engagement Triggered ---');
            await processAIRequest("SYSTEM: The chat has been quiet for a while. Provide a short, direct tech fact, a question for the audience, or a quick greeting/check-in with Mickael.", "proactive");
            continue;
        }

        io.emit('speech_start'); // Signals visual "listening" state
        const rawInput = await recognizeSpeech();

        if (rawInput.trim()) {
            // Transition to correcting state while AI cleans up the text
            io.emit('stt_correcting'); 
            
            const correctedInput = await correctSTT(rawInput);
            io.emit('user_speech', correctedInput);
            
            if (correctedInput.toLowerCase() === 'quit' || correctedInput.toLowerCase() === 'q') {
                await speak('Goodbye!');
                process.exit(0);
            }

            await processAIRequest(correctedInput, 'voice');
        } else {
            // No speech detected - just wait slightly and loop back
            // We DON'T emit idle here to keep the Red "Listening" circle active 
            // and avoid visual flickering while we restart the listener.
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }
}

main().catch(console.error);
