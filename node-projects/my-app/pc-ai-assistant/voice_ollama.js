// Required packages: npm install ollama express socket.io

const { Ollama } = require('ollama');
const express = require('express');
const { exec } = require('child_process');
const readline = require('readline');
const { createServer } = require('http');
const { Server } = require('socket.io');

const ollama = new Ollama();
const app = express();
const server = createServer(app);
const io = new Server(server);
const PORT = 3001;

// Cross-platform TTS
function speak(text) {
    const platform = process.platform;
    let command;

    if (platform === 'darwin') {
        command = `say "${text}"`;
    } else if (platform === 'win32') {
        command = `powershell -c "Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak('${text}')";`;
    } else {
        command = `espeak "${text}"`;
    }

    exec(command, (error) => {
        if (error) console.error('TTS Error:', error);
    });
}

// Terminal input handler
async function transcribeOnce() {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log('Listening... (type your message and press Enter)');
        rl.question('', (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

// AI conversation handler
async function askOllama(userText) {
    try {
        const prompt = `System: Answer in 1-3 spoken-friendly sentences, plain text only.\n\nUser: ${userText}\n\nAssistant:`;

        let fullResponse = '';
        const stream = await ollama.generate('phi3:mini', prompt);

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

        const input = await transcribeOnce();

        if (input.toLowerCase() === 'q') {
            io.emit('ai_response_end');
            speak('Goodbye!');
            process.exit(0);
        }

        if (!input.trim()) {
            io.emit('speech_end');
            continue;
        }

        // Processing phase
        io.emit('speech_end');
        console.log('EMITTED: speech_end (processing)');

        console.log(`You: ${input}`);
        const aiResponse = await askOllama(input);
        console.log(`AI: ${aiResponse}`);

        // Calculate dynamic speaking duration
        const wordCount = aiResponse.split(' ').length;
        const speakingDuration = Math.min(2000 + (wordCount * 250), 12000);
        const totalWaitDuration = speakingDuration + 1000;

        // Speaking phase
        setTimeout(() => {
            io.emit('ai_response_start');
            console.log('EMITTED: ai_response_start (turning green)');
            speak(aiResponse);
        }, 500);

        // End speaking phase
        setTimeout(() => {
            io.emit('ai_response_end');
            console.log('EMITTED: ai_response_end (back to white)');
        }, speakingDuration + 500);

        // Wait for complete cycle before next interaction
        await new Promise(resolve => setTimeout(resolve, totalWaitDuration));
    }
}

main().catch(console.error);
