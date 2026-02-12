[![Hippocratic License HL3-CL](https://img.shields.io/static/v1?label=Hippocratic%20License&message=HL3-CL&labelColor=5e2751&color=bc8c3d)](https://firstdonoharm.dev/version/3/0/cl.html)

# Chat AI

A unified TypeScript/JavaScript library for multiple AI providers including OpenAI, Anthropic Claude, Google Gemini,
DeepSeek, Grok, Mistral, Ollama, Qwen, Kimi, and Stability AI for chat completions, streaming, function calling,
embeddings, image generation, and video generation.

## Features

- **Unified Interface** - Consistent API across all providers
- **Streaming Support** - Real-time streaming responses
- **Function/Tool Calling** - Native support for AI function calling
- **Embeddings** - Generate text embeddings for RAG and search
- **Image Generation** - DALL-E, Stability AI, Grok, and Imagen
- **Video Generation** - Sora-2 video generation with async polling
- **Video Understanding** - Analyze videos with Gemini
- **Vision/Multimodal** - Easy image, audio, video, and document input helpers
- **Audio Input** - Send audio in chat messages (GPT-4o, Gemini)
- **Audio Output** - Speech-to-text (Whisper) and text-to-speech
- **Document Input** - Process PDFs and documents in chat
- **Realtime API** - Bidirectional audio streaming for voice apps
- **Reasoning/Thinking** - Extended thinking for Claude, reasoning effort for OpenAI o-series
- **Conversation Manager** - Multi-turn chat with history, serialization, editing, token-aware trimming, provider switching, and automated tool loops
- **Batch Processing** - Process multiple requests in parallel
- **Content Moderation** - Check content for policy violations
- **File Management** - Upload and manage files
- **Model Listing** - List available models from providers
- **Token Counting** - Estimate token usage before sending
- **Error Handling** - Comprehensive error types with automatic parsing
- **Retry Logic** - Built-in exponential backoff for transient failures
- **TypeScript** - Full type definitions included
- **Environment Variables** - Auto-detect API keys from environment

## Installation

```bash
bun add @joliegg/ai
# or
npm install @joliegg/ai
# or
yarn add @joliegg/ai
```

## Quick Start

```typescript
import { ChatGPT, Claude, Gemini, DeepSeek, Grok, Mistral, Ollama, Qwen, Kimi, Dream, configure } from '@joliegg/ai';

// Optional: Configure global settings
configure({
  timeout: 60000,
  maxRetries: 3,
  debug: false,
});

// Initialize providers (API keys auto-detected from environment)
const chatGPT = new ChatGPT(); // Uses OPENAI_API_KEY
const claude = new Claude(); // Uses ANTHROPIC_API_KEY or CLAUDE_API_KEY
const gemini = new Gemini(); // Uses GOOGLE_API_KEY or GEMINI_API_KEY
const mistral = new Mistral(); // Uses MISTRAL_API_KEY
const ollama = new Ollama(); // Uses local Ollama (no key needed)
const qwen = new Qwen(); // Uses DASHSCOPE_API_KEY
const kimi = new Kimi(); // Uses MOONSHOT_API_KEY

// Or pass API keys explicitly
const chatGPT2 = new ChatGPT('your-openai-api-key');
```

## Unified Interface

All providers support a consistent interface for chat completions:

```typescript
import { ChatGPT, Claude, Gemini } from '@joliegg/ai';

const ai = new ChatGPT(); // or new Claude(), new Gemini(), etc.

// Completion with consistent response format
const response = await ai.complete(
  [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What is the capital of France?' },
  ],
  {
    model: 'gpt-4o',
    maxTokens: 500,
    temperature: 0.7,
  }
);

console.log(response.content); // "The capital of France is Paris."
console.log(response.provider); // "openai"
console.log(response.finishReason); // "stop"
console.log(response.usage); // { promptTokens: 25, completionTokens: 10, totalTokens: 35 }
```

## Streaming

Real-time streaming is supported across all chat providers:

```typescript
import { ChatGPT } from '@joliegg/ai';

const chatGPT = new ChatGPT();

// Stream with async iteration
for await (const chunk of chatGPT.stream([{ role: 'user', content: 'Write a short story about a robot.' }])) {
  process.stdout.write(chunk.delta.content || '');
}

// Stream with callbacks
for await (const chunk of chatGPT.stream([{ role: 'user', content: 'Explain quantum computing.' }], {
  onToken: (token) => process.stdout.write(token),
  onToolCall: (toolCall) => console.log('Tool called:', toolCall),
})) {
  // Chunks are also yielded
}
```

## Function/Tool Calling

Native support for AI function calling with OpenAI, Claude, and Gemini:

```typescript
import { ChatGPT } from '@joliegg/ai';

const chatGPT = new ChatGPT();

const response = await chatGPT.complete([{ role: 'user', content: 'What is the weather in San Francisco?' }], {
  tools: [
    {
      name: 'get_weather',
      description: 'Get the current weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The city and state, e.g. San Francisco, CA',
          },
          unit: {
            type: 'string',
            enum: ['celsius', 'fahrenheit'],
            description: 'Temperature unit',
          },
        },
        required: ['location'],
      },
    },
  ],
  toolChoice: 'auto',
});

if (response.toolCalls) {
  for (const toolCall of response.toolCalls) {
    console.log('Function:', toolCall.name);
    console.log('Arguments:', toolCall.arguments);
    // { location: 'San Francisco, CA', unit: 'fahrenheit' }
  }
}
```

## Embeddings

Generate text embeddings for RAG, semantic search, and more:

```typescript
import { ChatGPT, Gemini, Mistral } from '@joliegg/ai';

// OpenAI embeddings
const chatGPT = new ChatGPT();
const openaiEmbed = await chatGPT.embed('Hello world', {
  model: 'text-embedding-3-small',
  dimensions: 512,
});
console.log(openaiEmbed.embeddings[0]); // [0.123, -0.456, ...]

// Gemini embeddings
const gemini = new Gemini();
const geminiEmbed = await gemini.embed(['Text 1', 'Text 2']);
console.log(geminiEmbed.embeddings); // [[...], [...]]

// Mistral embeddings
const mistral = new Mistral();
const mistralEmbed = await mistral.embed('Hello world');
```

## Reasoning / Extended Thinking

Enable advanced reasoning for supported models:

```typescript
import { ChatGPT, Claude, DeepSeek } from '@joliegg/ai';

// OpenAI o-series reasoning effort
const chatGPT = new ChatGPT();
const response = await chatGPT.complete(
  [{ role: 'user', content: 'Prove that the square root of 2 is irrational.' }],
  {
    model: 'o3-mini',
    reasoning: { effort: 'high' }, // 'low', 'medium', or 'high'
  }
);

// Claude extended thinking with token budget
const claude = new Claude();
const response2 = await claude.complete(
  [{ role: 'user', content: 'Solve this step by step: ...' }],
  {
    reasoning: { budget: 2000 }, // budget_tokens for thinking
  }
);

// DeepSeek reasoner (default model is deepseek-reasoner)
const deepSeek = new DeepSeek();
const response3 = await deepSeek.complete(
  [{ role: 'user', content: 'Explain the proof of Fermat\'s Last Theorem.' }]
);
```

## Error Handling

Comprehensive error handling with typed error classes:

```typescript
import { ChatGPT, AIError, AuthenticationError, RateLimitError, TimeoutError, isRetryableError } from '@joliegg/ai';

const chatGPT = new ChatGPT();

try {
  const response = await chatGPT.complete([{ role: 'user', content: 'Hello' }]);
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid API key:', error.message);
  } else if (error instanceof RateLimitError) {
    console.error('Rate limited, retry after:', error.retryAfter);
  } else if (error instanceof TimeoutError) {
    console.error('Request timed out');
  } else if (error instanceof AIError) {
    console.error('AI Error:', error.provider, error.code, error.message);
  }

  // Check if error is retryable
  if (isRetryableError(error)) {
    // Retry logic is handled automatically, but you can implement custom logic
  }
}
```

## Provider-Specific Examples

### OpenAI ChatGPT

```typescript
import { ChatGPT } from '@joliegg/ai';

const chatGPT = new ChatGPT('your-openai-api-key');

// Chat completion
const response = await chatGPT.complete([
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'Write a haiku about coding.' },
]);

console.log(response.content);

// With options
const response2 = await chatGPT.complete([{ role: 'user', content: 'Describe yourself in 5 words' }], {
  model: 'gpt-4o-mini',
  maxTokens: 300,
});
```

### Anthropic Claude

```typescript
import { Claude } from '@joliegg/ai';

const claude = new Claude('your-anthropic-api-key');

// Chat completion
const response = await claude.complete([{ role: 'user', content: 'Explain machine learning' }], {
  model: 'claude-sonnet-4-0',
  maxTokens: 500,
});

// Streaming
for await (const chunk of claude.stream([{ role: 'user', content: 'Write a poem about AI' }])) {
  process.stdout.write(chunk.delta.content || '');
}

// With tools
const toolResponse = await claude.complete([{ role: 'user', content: 'What time is it in Tokyo?' }], {
  tools: [
    {
      name: 'get_time',
      description: 'Get current time in a timezone',
      parameters: {
        type: 'object',
        properties: {
          timezone: { type: 'string' },
        },
        required: ['timezone'],
      },
    },
  ],
});
```

### Google Gemini

```typescript
import { Gemini } from '@joliegg/ai';

const gemini = new Gemini('your-google-api-key');

// Chat completion
const response = await gemini.complete([{ role: 'user', content: 'Explain quantum computing' }]);

// With conversation history
const response2 = await gemini.complete(
  [
    { role: 'user', content: 'Hello!' },
    { role: 'assistant', content: 'Hi there!' },
    { role: 'user', content: 'What is the capital of France?' },
  ],
  { model: 'gemini-3-pro-preview' }
);

// Embeddings
const embeddings = await gemini.embed('Hello world');
```

### DeepSeek

```typescript
import { DeepSeek } from '@joliegg/ai';

const deepSeek = new DeepSeek('your-deepseek-api-key');

// Chat completion
const response = await deepSeek.complete([{ role: 'user', content: 'Write a Python function for binary search' }], {
  model: 'deepseek-chat',
  maxTokens: 500,
});

// Streaming
for await (const chunk of deepSeek.stream([{ role: 'user', content: 'Explain recursion' }])) {
  process.stdout.write(chunk.delta.content || '');
}
```

### Grok

```typescript
import { Grok } from '@joliegg/ai';

const grok = new Grok('your-grok-api-key');

// Chat completion
const response = await grok.complete([{ role: 'user', content: 'What makes you unique?' }], {
  model: 'grok-4',
  maxTokens: 400,
});

// Streaming
for await (const chunk of grok.stream([{ role: 'user', content: 'Tell me a joke' }])) {
  process.stdout.write(chunk.delta.content || '');
}
```

### Mistral

```typescript
import { Mistral } from '@joliegg/ai';

const mistral = new Mistral('your-mistral-api-key');

// Chat completion
const response = await mistral.complete([{ role: 'user', content: 'Explain neural networks' }], {
  model: 'mistral-large-2511',
});

// Embeddings
const embeddings = await mistral.embed('Hello world', {
  model: 'mistral-embed',
});

// Streaming
for await (const chunk of mistral.stream([{ role: 'user', content: 'Write a story' }])) {
  process.stdout.write(chunk.delta.content || '');
}
```

### Ollama (Local LLMs)

```typescript
import { Ollama } from '@joliegg/ai';

// Connect to local Ollama instance
const ollama = new Ollama(); // Defaults to localhost:11434

// Or specify custom host
const ollama2 = new Ollama(undefined, {
  baseURL: 'http://my-server:11434/v1',
});

// Chat completion with local model
const response = await ollama.complete([{ role: 'user', content: 'Hello!' }], {
  model: 'llama3.3',
});

// Streaming
for await (const chunk of ollama.stream([{ role: 'user', content: 'Tell me about yourself' }], { model: 'mistral' })) {
  process.stdout.write(chunk.delta.content || '');
}

// Embeddings (requires embedding model like nomic-embed-text)
const embeddings = await ollama.embed('Hello world', {
  model: 'nomic-embed-text',
});
```

### Qwen

```typescript
import { Qwen } from '@joliegg/ai';

const qwen = new Qwen('your-dashscope-api-key');

// Chat completion
const response = await qwen.complete([{ role: 'user', content: 'Explain distributed systems' }], {
  model: 'qwen-max-latest', // or 'qwen3-max', 'qwen-plus', 'qwen-turbo', 'qwen-flash', 'qwq-plus'
});

// Streaming
for await (const chunk of qwen.stream([{ role: 'user', content: 'Write a poem' }])) {
  process.stdout.write(chunk.delta.content || '');
}

// Embeddings
const embeddings = await qwen.embed('Hello world', {
  model: 'text-embedding-v4',
});
```

### Kimi

```typescript
import { Kimi } from '@joliegg/ai';

const kimi = new Kimi('your-moonshot-api-key');

// Chat completion
const response = await kimi.complete([{ role: 'user', content: 'What is quantum entanglement?' }], {
  model: 'kimi-k2-thinking',
});

// Streaming
for await (const chunk of kimi.stream([{ role: 'user', content: 'Tell me a story' }])) {
  process.stdout.write(chunk.delta.content || '');
}

// Reasoning models
const response2 = await kimi.complete([{ role: 'user', content: 'Solve this math problem step by step' }], {
  model: 'kimi-k2-thinking',
});
```

## Image Generation

### OpenAI DALL-E

```typescript
import { ChatGPT } from '@joliegg/ai';
import fs from 'fs';

const chatGPT = new ChatGPT('your-openai-api-key');

// Generate with DALL-E 3
const images = await chatGPT.generate({
  prompt: 'A yellow cat looking at a birthday cake',
  n: 1,
  size: '1024x1024',
  model: 'dall-e-3',
  quality: 'standard',
  format: 'png',
  background: 'auto',
});

fs.writeFileSync('cat-cake.png', images[0]);

// Generate multiple with DALL-E 2
const images2 = await chatGPT.generate({
  prompt: 'A futuristic city skyline at sunset',
  n: 4,
  size: '512x512',
  model: 'dall-e-2',
  quality: 'standard',
  format: 'png',
  background: 'auto',
});
```

### Stability AI

```typescript
import { Dream } from '@joliegg/ai';
import fs from 'fs';

const dream = new Dream('your-stability-api-key', 'ultra');

// Text to image
const image = await dream.generate({
  prompt: 'A magical forest with glowing mushrooms',
  aspectRatio: '16:9',
  style: 'fantasy-art',
  seed: 12345,
  outputFormat: 'png',
});

fs.writeFileSync('forest.png', image);

// Image to image
const inputBuffer = fs.readFileSync('input.png');
const edited = await dream.generateFromImage({
  image: inputBuffer,
  prompt: 'Make it more vibrant',
  strength: 0.5,
  style: 'enhance',
});
```

### Grok Image Generation

```typescript
import { Grok } from '@joliegg/ai';
import fs from 'fs';

const grok = new Grok('your-grok-api-key');

const images = await grok.generate({
  prompt: 'A futuristic robot exploring an alien planet',
  n: 2,
  model: 'grok-2-image',
});

images.forEach((buffer, i) => {
  fs.writeFileSync(`robot-${i}.png`, buffer);
});
```

## Video Generation (Sora-2)

Generate videos using OpenAI's Sora-2 model:

```typescript
import { ChatGPT } from '@joliegg/ai';
import fs from 'fs';

const chatGPT = new ChatGPT();

// Start a video generation job
const job = await chatGPT.generateVideo({
  prompt: 'A sweeping drone shot over ancient ruins at sunrise',
  model: 'sora-2', // or 'sora-2-pro' for higher quality
  size: '1280x720', // landscape, or '720x1280' for portrait
  seconds: 8, // 4, 8, or 12 seconds
});

console.log('Job started:', job.id);
console.log('Status:', job.status); // 'pending' or 'processing'

// Poll for completion
const result = await chatGPT.getVideo(job.id);
if (result.status === 'completed') {
  console.log('Video URL:', result.videoUrl);
}

// Or use the convenience method to wait for completion
const video = await chatGPT.generateVideoAndWait({
  prompt: 'A cat playing piano in a jazz club',
  model: 'sora-2-pro',
  seconds: 4,
});

console.log('Video ready:', video.videoUrl);

// Download and save the video
const videoBuffer = await chatGPT.downloadVideo(video.videoUrl);
fs.writeFileSync('cat-piano.mp4', videoBuffer);

// Or generate and download in one step
const buffer = await chatGPT.generateVideoBuffer({
  prompt: 'Northern lights dancing over a frozen lake',
  size: '1920x1080',
  seconds: 12,
});

fs.writeFileSync('northern-lights.mp4', buffer);
```

### Using Reference Images

Guide the video style with a reference image:

```typescript
import { ChatGPT } from '@joliegg/ai';
import fs from 'fs';

const chatGPT = new ChatGPT();

// Load reference image
const referenceImage = fs.readFileSync('./style-reference.jpg');

const video = await chatGPT.generateVideoAndWait({
  prompt: 'A person walking through a cyberpunk city at night',
  inputReference: referenceImage,
  model: 'sora-2-pro',
  size: '1280x720',
  seconds: 8,
});
```

### Video Generation Options

| Option           | Type   | Default      | Description                            |
| ---------------- | ------ | ------------ | -------------------------------------- |
| `prompt`         | string | required     | Description of the video to generate   |
| `model`          | string | `'sora-2'`   | `'sora-2'` or `'sora-2-pro'`           |
| `size`           | string | `'1280x720'` | Resolution (see supported sizes below) |
| `seconds`        | number | `4`          | Duration: `4`, `8`, or `12` seconds    |
| `inputReference` | Buffer | optional     | Reference image to guide visual style  |

### Supported Video Sizes

| Size        | Aspect Ratio | Description |
| ----------- | ------------ | ----------- |
| `1280x720`  | 16:9         | Landscape   |
| `720x1280`  | 9:16         | Portrait    |
| `1920x1080` | 16:9         | Full HD     |
| `1080x1920` | 9:16         | Full HD     |
| `1280x1280` | 1:1          | Square      |

## Vision/Multimodal

Easy helpers for working with images in chat:

```typescript
import {
  ChatGPT,
  imageFromFile,
  imageFromURL,
  imageFromBuffer,
  withImages,
  userMessage,
  createMessageBuilder,
} from '@joliegg/ai';

const chatGPT = new ChatGPT();

// Create image from file
const image = imageFromFile('./photo.jpg');

// Create image from URL
const imageUrl = imageFromURL('https://example.com/image.png');

// Create image from buffer
const imageBuffer = imageFromBuffer(buffer, 'image/png');

// Create a message with text and images
const message = userMessage(withImages('What is in this image?', image));

// Use with complete
const response = await chatGPT.complete([message]);

// Or use MessageBuilder for complex conversations
const messages = createMessageBuilder()
  .system('You are a helpful assistant that can see images.')
  .userWithImages('Describe this photo', imageFromFile('./vacation.jpg'))
  .build();

const response2 = await chatGPT.complete(messages);
```

## Document Input (PDFs)

Process PDFs and documents in chat with all providers:

```typescript
import { ChatGPT, Claude, Gemini, documentFromFile, userMessage, withDocuments } from '@joliegg/ai';

// Create document from file
const doc = documentFromFile('./report.pdf');

// Use with OpenAI
const chatGPT = new ChatGPT();
const response = await chatGPT.complete([userMessage(withDocuments('Summarize this document', doc))]);

// Use with Claude (excellent PDF support)
const claude = new Claude();
const response2 = await claude.complete([userMessage(withDocuments('What are the key findings?', doc))]);

// Use with Gemini
const gemini = new Gemini();
const response3 = await gemini.complete([userMessage(withDocuments('Extract the main points', doc))]);

// Multiple documents
const doc1 = documentFromFile('./report1.pdf');
const doc2 = documentFromFile('./report2.pdf');
const response4 = await claude.complete([userMessage(withDocuments('Compare these documents', doc1, doc2))]);

// From buffer or URL
import { documentFromBuffer, documentFromURL } from '@joliegg/ai';

const docBuffer = documentFromBuffer(pdfBuffer, 'application/pdf', 'report.pdf');
const docUrl = documentFromURL('https://example.com/document.pdf');
```

## Audio Input in Chat

Send audio directly in chat messages (GPT-4o, Gemini):

```typescript
import { ChatGPT, Gemini, audioFromFile, userMessage, withAudio, createMessageBuilder } from '@joliegg/ai';

// Create audio content
const audio = audioFromFile('./recording.mp3');

// Use with GPT-4o
const chatGPT = new ChatGPT();
const response = await chatGPT.complete([userMessage(withAudio('Transcribe and summarize this', audio))]);

// Use with Gemini
const gemini = new Gemini();
const response2 = await gemini.complete([userMessage(withAudio('What is being discussed?', audio))]);

// Using MessageBuilder
const messages = createMessageBuilder()
  .system('You are a helpful assistant.')
  .userWithAudio('What language is being spoken?', audioFromFile('./speech.wav'))
  .build();

// From buffer or URL
import { audioFromBuffer, audioFromURL } from '@joliegg/ai';

const audioBuffer = audioFromBuffer(wavBuffer, 'audio/wav');
const audioUrl = audioFromURL('https://example.com/audio.mp3');
```

## Video Understanding

Analyze videos with Gemini:

```typescript
import { Gemini, videoFromFile, userMessage, withVideo, createMessageBuilder } from '@joliegg/ai';

const gemini = new Gemini();

// Analyze a video
const video = videoFromFile('./demo.mp4');
const response = await gemini.complete([userMessage(withVideo('What happens in this video?', video))]);

// Ask specific questions
const response2 = await gemini.complete([
  userMessage(withVideo('How many people appear in this video and what are they doing?', video)),
]);

// Using MessageBuilder
const messages = createMessageBuilder()
  .system('You are a video analysis expert.')
  .userWithVideo('Describe the key scenes', videoFromFile('./presentation.mp4'))
  .build();

const response3 = await gemini.complete(messages);

// From buffer or URL
import { videoFromBuffer, videoFromURL } from '@joliegg/ai';

const videoBuffer = videoFromBuffer(mp4Buffer, 'video/mp4');
const videoUrl = videoFromURL('https://example.com/video.mp4');
```

## Realtime API (Voice Apps)

Build voice applications with bidirectional audio streaming:

```typescript
import { ChatGPT } from '@joliegg/ai';

const chatGPT = new ChatGPT();

// Create a realtime session
const session = chatGPT.createRealtimeSession({
  model: 'gpt-4o-realtime-preview',
  voice: 'nova', // alloy, echo, shimmer, ash, ballad, coral, sage, verse
  instructions: 'You are a helpful voice assistant.',
  inputAudioFormat: 'pcm16',
  outputAudioFormat: 'pcm16',
  turnDetection: {
    type: 'server_vad',
    threshold: 0.5,
    silenceDurationMs: 500,
  },
});

// Connect to the realtime API
await session.connect();

// Handle events
session.on('response.audio.delta', (event) => {
  // event.delta contains base64 audio chunk
  const audioChunk = Buffer.from(event.delta, 'base64');
  // Play audio chunk through speaker
});

session.on('response.audio_transcript.delta', (event) => {
  // Display real-time transcript
  process.stdout.write(event.delta);
});

session.on('conversation.item.created', (event) => {
  console.log('New conversation item:', event.item);
});

// Send audio data
session.sendAudio(audioBuffer); // Send recorded audio
session.commitAudio(); // Signal end of audio input

// Or send text (for testing)
session.sendText('Hello, how are you?');

// Cancel ongoing response
session.cancelResponse();

// Clear audio buffer
session.clearAudioBuffer();

// Check connection status
console.log('Connected:', session.isConnected);

// Close session
session.close();
```

## Imagen (Gemini Image Generation)

Generate images with Google's Imagen:

```typescript
import { Gemini } from '@joliegg/ai';
import fs from 'fs';

const gemini = new Gemini();

// Generate images
const result = await gemini.generateImage({
  prompt: 'A serene mountain landscape at sunset with a reflective lake',
  model: 'imagen-4.0-generate-001', // or 'imagen-3.0-fast-generate-001'
  numberOfImages: 2,
  aspectRatio: '16:9', // '1:1', '3:4', '4:3', '9:16', '16:9'
});

// Save images
result.images.forEach((buffer, i) => {
  fs.writeFileSync(`landscape-${i}.png`, buffer);
});

// With negative prompt and safety settings
const result2 = await gemini.generateImage({
  prompt: 'A cute cartoon robot',
  negativePrompt: 'scary, dark, violent',
  numberOfImages: 4,
  aspectRatio: '1:1',
  personGeneration: 'allow_adult', // or 'dont_allow'
  safetyFilterLevel: 'block_medium_and_above',
  addWatermark: false,
});
```

## Audio

### Speech-to-Text (Whisper)

Transcribe audio files to text:

```typescript
import { ChatGPT } from '@joliegg/ai';
import fs from 'fs';

const chatGPT = new ChatGPT();

// Transcribe from file path
const transcript = await chatGPT.transcribe('./audio.mp3', {
  language: 'en',
  responseFormat: 'verbose_json',
});

console.log(transcript.text);
console.log(transcript.duration); // Duration in seconds
console.log(transcript.segments); // Timestamped segments

// Transcribe from buffer
const audioBuffer = fs.readFileSync('./audio.mp3');
const transcript2 = await chatGPT.transcribe(audioBuffer);
```

### Text-to-Speech

Convert text to spoken audio:

```typescript
import { ChatGPT } from '@joliegg/ai';
import fs from 'fs';

const chatGPT = new ChatGPT();

// Generate speech
const audioBuffer = await chatGPT.speak('Hello, world!', {
  voice: 'nova', // alloy, echo, fable, onyx, nova, shimmer
  model: 'tts-1-hd', // tts-1 or tts-1-hd
  speed: 1.0, // 0.25 to 4.0
  responseFormat: 'mp3', // mp3, opus, aac, flac, wav, pcm
});

fs.writeFileSync('output.mp3', audioBuffer);
```

## Conversation Manager

Manage multi-turn conversations with automatic history, serialization, editing, and token-aware trimming:

```typescript
import { ChatGPT, Conversation } from '@joliegg/ai';
import type { ConversationJSON } from '@joliegg/ai';

const chatGPT = new ChatGPT();

// Create a conversation
const chat = chatGPT.createConversation({
  systemPrompt: 'You are a helpful coding assistant.',
  model: 'gpt-4o',
  maxHistory: 20, // Keep last 20 messages (trims by whole exchanges)
  maxContextTokens: 8000, // Token budget for input context window
});

// Send messages - history is managed automatically
const response1 = await chat.send('What is recursion?');
console.log(response1.content);

const response2 = await chat.send('Can you give me an example?');
console.log(response2.content); // Knows we're talking about recursion

// Stream responses (tool calls are captured in history automatically)
for await (const chunk of chat.sendStream('Write a recursive factorial function')) {
  process.stdout.write(chunk.delta.content || '');
}

// Error rollback: if send() or sendStream() fails, the user message
// is automatically removed from history so you can retry safely.

// Conversation utilities
console.log(chat.length); // Number of messages (excluding system)
console.log(chat.getHistory()); // Get full history (deep cloned)

chat.undo(); // Remove last exchange
chat.clear(); // Clear history (keeps system prompt)
chat.reset('New system prompt'); // Start fresh

// Fork conversation for branching
const branch = chat.fork();
await branch.send('What about iteration instead?');

// Edit a message and truncate history after it
chat.editMessage(1, 'Actually, explain it differently');
await chat.send('Actually, explain it differently'); // Continue from edited point

// Serialize / restore conversations
const json: ConversationJSON = chat.toJSON();
// Save to file, database, etc.

const restored = Conversation.fromJSON(chatGPT, json);
await restored.send('Continue where we left off');

// Summarize old messages to save tokens
await chat.summarize(4); // Keep last 4 messages, summarize the rest
```

### Ergonomic Multimodal Input

`send()` and `sendStream()` accept flexible input types — no need to manually wrap content in `Message` objects:

```typescript
import { ChatGPT, imageFromURL, text, createConversation } from '@joliegg/ai';

const chat = createConversation(new ChatGPT());

// Plain string (as before)
await chat.send('Hello');

// A full Message object (as before)
await chat.send({ role: 'user', content: 'Hello' });

// A single MessageContent object — automatically wrapped as a user message
await chat.send({ type: 'image', source: { type: 'url', data: 'https://example.com/photo.jpg' } });

// An array of MessageContent parts — automatically wrapped as a user message
await chat.send([
  text('Describe this image:'),
  imageFromURL('https://example.com/photo.jpg'),
]);

// Works with streaming too
for await (const chunk of chat.sendStream([
  text('What do you see?'),
  imageFromURL('https://example.com/photo.jpg'),
])) {
  process.stdout.write(chunk.delta.content || '');
}
```

### Provider Switching

Switch providers mid-conversation for multi-agent workflows or cost optimization:

```typescript
import { ChatGPT, Claude, Gemini, createConversation } from '@joliegg/ai';

const chatGPT = new ChatGPT();
const claude = new Claude();
const gemini = new Gemini();

const chat = createConversation(chatGPT);

// Check current provider
console.log(chat.currentProvider); // ChatGPT instance

// Permanently switch provider
chat.setProvider(claude);
await chat.send('Now using Claude'); // Uses Claude

// Per-call override (does NOT change the permanent provider)
await chat.send('One-off with Gemini', { provider: gemini });
console.log(chat.currentProvider); // Still Claude

// Works with streaming too
for await (const chunk of chat.sendStream('Stream from GPT', { provider: chatGPT })) {
  process.stdout.write(chunk.delta.content || '');
}

// fork() copies the current provider
chat.setProvider(gemini);
const forked = chat.fork();
console.log(forked.currentProvider); // Gemini
```

### Automated Tool Loop

Run multi-turn tool-call loops automatically with `runToolLoop()`:

```typescript
import { ChatGPT, createConversation } from '@joliegg/ai';
import type { ToolCall } from '@joliegg/ai';

const chat = createConversation(new ChatGPT());

const response = await chat.runToolLoop('What is the weather in NYC and SF?', {
  // Provide a handler that executes tool calls and returns results
  toolHandler: async (toolCall: ToolCall) => {
    if (toolCall.name === 'get_weather') {
      const city = toolCall.arguments.city as string;
      return `${city}: Sunny, 72°F`;
    }
    return 'Unknown tool';
  },
  maxIterations: 10, // Default: 10. Limits loop rounds to prevent runaway.
  // All standard completion options are supported:
  tools: [
    {
      name: 'get_weather',
      description: 'Get weather for a city',
      parameters: {
        type: 'object',
        properties: { city: { type: 'string' } },
        required: ['city'],
      },
    },
  ],
  // Per-call provider override works here too:
  // provider: someOtherProvider,
});

// response is the final Response after all tool calls are resolved
console.log(response.content); // "NYC is sunny at 72°F and SF is..."

// History contains the full trace: user → assistant(tool_calls) → tool → ... → assistant(final)
console.log(chat.getHistory());
```

### Conversation Options

| Option            | Type   | Description                                              |
| ----------------- | ------ | -------------------------------------------------------- |
| `systemPrompt`    | string | System prompt for the conversation                       |
| `model`           | string | Default model to use                                     |
| `maxTokens`       | number | Default max output tokens                                |
| `temperature`     | number | Default temperature                                      |
| `maxHistory`      | number | Max non-system messages (trims oldest exchanges first)   |
| `maxContextTokens`| number | Token budget for input context (trims oldest exchanges)  |

## Batch Processing

Process multiple requests efficiently:

```typescript
import { ChatGPT } from '@joliegg/ai';

const chatGPT = new ChatGPT();

// Define batch requests
const requests = [
  { id: 'q1', messages: [{ role: 'user', content: 'What is 2+2?' }] },
  {
    id: 'q2',
    messages: [{ role: 'user', content: 'What is the capital of France?' }],
  },
  { id: 'q3', messages: [{ role: 'user', content: 'Who wrote Hamlet?' }] },
];

// Process with concurrency control (default: 5 parallel requests)
const results = await chatGPT.completeBatch(
  requests,
  { maxTokens: 100 }, // Shared options
  5 // Max concurrent requests
);

// Handle results
for (const result of results) {
  if (result.error) {
    console.error(`${result.id} failed:`, result.error.message);
  } else {
    console.log(`${result.id}:`, result.response?.content);
  }
}
```

## Content Moderation

Check content for policy violations:

```typescript
import { ChatGPT } from '@joliegg/ai';

const chatGPT = new ChatGPT();

// Moderate single text
const results = await chatGPT.moderate('Some text to check');

if (results[0].flagged) {
  console.log('Content flagged!');
  console.log('Categories:', results[0].categories);
  // {
  //   hate: { flagged: false, score: 0.001 },
  //   violence: { flagged: true, score: 0.95 },
  //   ...
  // }
}

// Moderate multiple texts at once
const batchResults = await chatGPT.moderate(['First text to check', 'Second text to check', 'Third text to check']);

batchResults.forEach((result, i) => {
  console.log(`Text ${i + 1}: ${result.flagged ? 'FLAGGED' : 'OK'}`);
});
```

## File Management

Upload and manage files for fine-tuning, assistants, and more:

```typescript
import { ChatGPT } from '@joliegg/ai';
import fs from 'fs';

const chatGPT = new ChatGPT();

// Upload a file
const file = await chatGPT.uploadFile('./training-data.jsonl', {
  purpose: 'fine-tune', // 'assistants', 'fine-tune', 'batch', 'vision'
});
console.log('Uploaded:', file.id, file.filename);

// Upload from buffer
const buffer = fs.readFileSync('./data.jsonl');
const file2 = await chatGPT.uploadFile(buffer, { purpose: 'fine-tune' });

// List files
const fileList = await chatGPT.listFiles('fine-tune');
console.log(
  'Files:',
  fileList.files.map((f) => f.filename)
);

// Get file content
const content = await chatGPT.getFileContent(file.id);
fs.writeFileSync('downloaded.jsonl', content);

// Delete file
const deleted = await chatGPT.deleteFile(file.id);
console.log('Deleted:', deleted);
```

## Model Listing

List available models from providers:

```typescript
import { ChatGPT } from '@joliegg/ai';

const chatGPT = new ChatGPT();

// List all models
const models = await chatGPT.listModels();
console.log('Available models:', models.models.length);

for (const model of models.models) {
  console.log(`- ${model.id}`);
  console.log(`  Owner: ${model.ownedBy}`);
  console.log(`  Capabilities:`, model.capabilities);
}

// Get specific model details
const gpt4o = await chatGPT.getModel('gpt-4o');
console.log('GPT-4o capabilities:', gpt4o.capabilities);
// { chat: true, vision: true, functionCalling: true, ... }
```

## Token Counting

Estimate token usage before sending requests:

```typescript
import { ChatGPT } from '@joliegg/ai';

const chatGPT = new ChatGPT();

const messages = [
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'Write a long story about a magical kingdom.' },
];

// Estimate tokens
const estimate = chatGPT.countTokens(messages, 'gpt-4o');
console.log('Estimated tokens:', estimate.tokens);
console.log('Breakdown:', estimate.breakdown);
// { messages: 15, overhead: 3 }

// Use for cost estimation or to check context limits
if (estimate.tokens > 100000) {
  console.log('Warning: Large request, consider summarizing');
}
```

## Global Configuration

Configure default settings for all providers:

```typescript
import { configure, getGlobalConfig } from '@joliegg/ai';

// Set global defaults
configure({
  timeout: 30000, // 30 second timeout
  maxRetries: 5, // Retry up to 5 times
  retryDelay: 2000, // Start with 2 second delay
  debug: true, // Enable debug logging
});

// Get current configuration
const config = getGlobalConfig();
console.log(config);

// Provider-specific config overrides global
const chatGPT = new ChatGPT('key', {
  timeout: 60000, // Override for this instance
  maxRetries: 3,
});
```

## TypeScript Types

All types are exported for TypeScript users:

```typescript
import type {
  // Message types
  Message,
  MessageRole,
  TextContent,
  ImageContent,
  AudioContent,
  VideoContent,
  DocumentContent,

  // Tool types
  ToolDefinition,
  ToolCall,

  // Response types
  Response,
  Chunk,
  FinishReason,

  // Options
  CompletionOptions,
  StreamOptions,
  EmbeddingOptions,

  // Audio types
  TranscriptionOptions,
  TranscriptionResponse,
  TTSOptions,
  TTSVoice,
  TTSModel,

  // Video types
  VideoGenerationOptions,
  VideoJob,
  VideoResponse,

  // Imagen types
  ImagenOptions,
  ImagenResponse,

  // Realtime types
  RealtimeSessionConfig,
  RealtimeEvent,
  RealtimeVoice,

  // Moderation types
  ModerationOptions,
  ModerationResult,
  ModerationCategory,

  // File types
  FileUploadOptions,
  FileInfo,
  FileListResponse,

  // Model types
  ModelInfo,
  ModelListResponse,

  // Batch types
  BatchRequest,
  BatchResponse,

  // Conversation types
  ConversationOptions,
  ConversationJSON,
  SendContent,
  ToolHandler,
  ToolLoopOptions,
  ConversationSendOptions,
  ConversationStreamOptions,

  // Token counting
  TokenCountResult,

  // Config
  ProviderConfig,
  GlobalConfig,

  // Provider interfaces
  AIProvider,
} from '@joliegg/ai';
```

## Model Reference

### Chat Models

| Provider | Models                                                                              |
| -------- | ----------------------------------------------------------------------------------- |
| OpenAI   | `gpt-5.2` (default), `gpt-5`, `gpt-5-mini`, `gpt-4o`, `gpt-4o-mini`, `o3-mini`      |
| Claude   | `claude-sonnet-4-0` (default), `claude-opus-4-1`, `claude-3-7-sonnet-latest`         |
| Gemini   | `gemini-3-pro-preview` (default), `gemini-3-flash-preview`, `gemini-2.5-pro`         |
| DeepSeek | `deepseek-reasoner` (default), `deepseek-chat`                                      |
| Grok     | `grok-4-1-fast-reasoning` (default), `grok-4`, `grok-4-1-fast-non-reasoning`       |
| Mistral  | `mistral-large-2511` (default), `mistral-large-latest`, `mistral-medium-latest`     |
| Ollama   | `llama3.3` (default), any pulled model                                              |
| Qwen     | `qwen-max-latest` (default), `qwen3-max`, `qwen-plus`, `qwen-turbo`, `qwen-flash`  |
| Kimi     | `kimi-k2-thinking` (default), `kimi-k2-thinking-turbo`, `kimi-k2.5`                |

### Image Models

| Provider  | Models                                                    |
| --------- | --------------------------------------------------------- |
| OpenAI    | `dall-e-3`, `dall-e-2`, `gpt-image-1`, `gpt-image-1.5`    |
| Grok      | `grok-2-image`                                            |
| Stability | `ultra`, `core`, `sd3` engines                            |
| Gemini    | `imagen-4.0-generate-001`, `imagen-4.0-fast-generate-001`, `imagen-4.0-ultra-generate-001`, `imagen-3.0-generate-001`, `imagen-3.0-fast-generate-001` |

### Embedding Models

| Provider | Models                                                       |
| -------- | ------------------------------------------------------------ |
| OpenAI   | `text-embedding-3-small` (default), `text-embedding-3-large` |
| Gemini   | `gemini-embedding-001` (default)                             |
| Mistral  | `mistral-embed` (default)                                    |
| DeepSeek | `deepseek-embedding-v2` (default)                            |
| Ollama   | `nomic-embed-text` (default)                                 |
| Qwen     | `text-embedding-v4` (default), `text-embedding-v3`           |

### Audio Models

| Provider | Type          | Models              |
| -------- | ------------- | ------------------- |
| OpenAI   | Transcription | `whisper-1`         |
| OpenAI   | TTS           | `tts-1`, `tts-1-hd` |

### Video Models

| Provider | Models                           |
| -------- | -------------------------------- |
| OpenAI   | `sora-2` (default), `sora-2-pro` |

## Environment Variables

The library auto-detects API keys from these environment variables:

| Provider | Environment Variable                                    |
| -------- | ------------------------------------------------------- |
| OpenAI   | `OPENAI_API_KEY`                                        |
| Claude   | `ANTHROPIC_API_KEY` or `CLAUDE_API_KEY`                 |
| Gemini   | `GOOGLE_API_KEY` or `GEMINI_API_KEY`                    |
| DeepSeek | `DEEPSEEK_API_KEY`                                      |
| Grok     | `GROK_API_KEY`                                          |
| Mistral  | `MISTRAL_API_KEY`                                       |
| Ollama   | `OLLAMA_HOST` (optional, defaults to `localhost:11434`) |
| Qwen     | `DASHSCOPE_API_KEY`                                     |
| Kimi     | `MOONSHOT_API_KEY`                                      |

## License

This project is licensed under the Hippocratic License 3.0 - see the [LICENSE.md](LICENSE.md) file for details.
