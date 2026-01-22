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
const io = new Server(server);
const PORT = 3001;
const MEMORY_BANK_DIR = path.join(__dirname, 'memory-bank');

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

    // Keywords that trigger specific memories
    const keywordMap = {
        personality: ['who are you', 'personality', 'character', 'about you'],
        capabilities: ['what can you do', 'skills', 'abilities', 'expertise', 'programming'],
        projects: ['project', 'development', 'code', 'application', 'work'],
        finances: ['finance', 'money', 'invest', 'stock', 'market', 'saving', 'budget', 'wealth', 'retirement', 'debt']
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

    // Always include personality for context
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

// Cross-platform TTS
function speak(text) {
    return new Promise((resolve) => {
        // Sanitize text for TTS - remove emojis, backticks, asterisks, and escape single quotes
        const sanitizedText = text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').replace(/`/g, '').replace(/\*/g, '').replace(/'/g, "''");

        const platform = process.platform;
        let command;

        if (platform === 'darwin') {
            command = `say "${sanitizedText}"`;
        } else if (platform === 'win32') {
            const psCommand = `Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak('${sanitizedText}')`;
            const encoded = Buffer.from(psCommand, 'utf16le').toString('base64');
            command = `powershell -EncodedCommand ${encoded}`;
        } else {
            command = `espeak "${sanitizedText}"`;
        }

        console.log('TTS Command:', command);
        exec(command, (error) => {
            if (error) console.error('TTS Error:', error);
            resolve();
        });
    });
}

// Cross-platform speech recognition
async function recognizeSpeech() {
    return new Promise((resolve) => {
        const command = 'python speech_recog.py';
        exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
            console.log('STDERR:', stderr);
            if (error) {
                console.error('Speech Recognition Error:', error);
                resolve('');
            } else {
                resolve(stdout.trim());
            }
        });
    });
}

// AI conversation handler
async function askOllama(userText) {
    const aiCharacter = 'You are a helpful developer assistant, specialized in modern technology and web development';

    try {
        // Load and process memory bank
        const memoryFiles = loadMemoryFiles();
        const relevantMemories = findRelevantMemories(userText, memoryFiles);
        const memoryContext = buildMemoryContext(relevantMemories);

        console.log(`Memory: Found ${relevantMemories.length} relevant memory files`);

        // Build enhanced prompt with memory context
        const prompt = `System: Answer in 1-2 brief, spoken-friendly sentences, plain text only. Keep it concise and conversational.\n\nYou: ${aiCharacter}${memoryContext}\n\nUser: ${userText}\n\nAssistant:`;

        let fullResponse = '';
        const stream = await ollama.generate('llama2:7b', prompt);

        for await (const token of stream) {
            fullResponse += token;
        }

        return fullResponse;
    } catch (error) {
        console.error('Ollama Error:', error);
        return 'Sorry, I encountered an error.';
    }
}

// Main conversation loop
async function main() {
    console.log('Voice Assistant started. Press Enter to speak, type "q" to quit.');
    console.log(`React visual available at: http://localhost:3000/pc-ai-assistant`);
    console.log(`Voice server running on port: ${PORT}`);

    // Note: Static file serving removed - visuals are handled by React app
    server.listen(PORT, () => {
        console.log(`Voice server running at http://localhost:${PORT}`);
    });

    io.on('connection', (socket) => {
        console.log('Browser connected to visual interface');
    });

    while (true) {
        // Start listening phase
        io.emit('speech_start');
        console.log('EMITTED: speech_start (ready for input)');

        const input = await recognizeSpeech();

        console.log(`DEBUG: Recognized speech: "${input}"`);

        if (input.toLowerCase() === 'quit' || input.toLowerCase() === 'q') {
            io.emit('ai_response_end');
            speak('Goodbye!');
            process.exit(0);
        }

        if (!input.trim()) {
            io.emit('idle');
            continue;
        }

        // Processing phase
        io.emit('speech_end');
        console.log('EMITTED: speech_end (processing)');

        console.log(`You: ${input}`);
        console.log('DEBUG: Sending to AI for processing...');
        const aiResponse = await askOllama(input);
        console.log(`AI: ${aiResponse}`);
        console.log(`DEBUG: AI response received: "${aiResponse}"`);

        // Speaking phase
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay before starting speech
        io.emit('ai_response_start');
        console.log('EMITTED: ai_response_start (turning green)');
        await speak(aiResponse);
        io.emit('ai_response_end');
        console.log('EMITTED: ai_response_end (back to white)');

        // Small delay before next listening phase
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

main().catch(console.error);
