[![Hippocratic License HL3-CL](https://img.shields.io/static/v1?label=Hippocratic%20License&message=HL3-CL&labelColor=5e2751&color=bc8c3d)](https://firstdonoharm.dev/version/3/0/cl.html)

# Chat AI

This library provides a unified interface for multiple AI providers including OpenAI, StabilityAI, Google Gemini, and DeepSeek for both chat completions and image generation.

## Installation

```bash
yarn add @joliegg/ai
```

## Quick Start

```javascript
import { ChatGPT, Dream, Gemini, DeepSeek } from '@joliegg/ai';

// Initialize with your API keys
const chatGPT = new ChatGPT(process.env.OPENAI_API_KEY);
const dream = new Dream(process.env.STABILITY_API_KEY);
const gemini = new Gemini(process.env.GOOGLE_API_KEY);
const deepSeek = new DeepSeek(process.env.DEEPSEEK_API_KEY);
```

## Usage

### Chat Completions

#### OpenAI ChatGPT

```javascript
import { ChatGPT } from '@joliegg/ai';

const chatGPT = new ChatGPT('your-openai-api-key');

// Simple completion with default model
const completion = await chatGPT.complete([
  { role: 'user', content: 'Describe yourself in 5 words' }
]);

// Completion with custom model and token limit
const completion2 = await chatGPT.complete([
  { role: 'user', content: 'Write a detailed explanation of quantum computing' }
], 'gpt-4o-mini', 500);

// Chat conversation
const conversation = await chatGPT.complete([
  { role: 'system', content: 'You are a helpful coding assistant.' },
  { role: 'user', content: 'How do I implement a binary search?' },
  { role: 'assistant', content: 'Here\'s how to implement binary search...' },
  { role: 'user', content: 'Can you show me the Python version?' }
], 'gpt-4o', 800);

console.log(completion.choices[0].message.content);
```

#### Google Gemini

```javascript
import { Gemini } from '@joliegg/ai';

const gemini = new Gemini('your-google-api-key');

// Single prompt with default model
const result = await gemini.complete('Explain quantum computing in simple terms');

// Single prompt with custom model
const result2 = await gemini.complete(
  'Write a Python function to calculate fibonacci numbers',
  null,
  'gemini-1.5-pro'
);

// Chat conversation with history
const chatResult = await gemini.complete(
  'What is the capital of France?',
  {
    history: [
      { role: 'user', parts: ['Hello!'] },
      { role: 'model', parts: ['Hi there! How can I help you today?'] }
    ]
  },
  'gemini-2.5-pro'
);

// Multi-part content
const multiPartResult = await gemini.complete([
  'Analyze this image and describe what you see:',
  { inlineData: { mimeType: 'image/jpeg', data: 'base64-encoded-image' } }
]);
```

#### DeepSeek

```javascript
import { DeepSeek } from '@joliegg/ai';

const deepSeek = new DeepSeek('your-deepseek-api-key');

// Simple completion with default model
const completion = await deepSeek.complete([
  { role: 'user', content: 'Write a short poem about coding' }
]);

// Completion with custom model and token limit
const completion2 = await deepSeek.complete([
  { role: 'user', content: 'Explain the concept of recursion with examples' }
], 'deepseek-coder', 400);

// Chat conversation
const conversation = await deepSeek.complete([
  { role: 'system', content: 'You are a programming tutor.' },
  { role: 'user', content: 'What is object-oriented programming?' },
  { role: 'assistant', content: 'Object-oriented programming is a paradigm...' },
  { role: 'user', content: 'Can you give me a practical example?' }
], 'deepseek-chat', 600);
```

### Image Generation

#### OpenAI DALL-E

```javascript
import { ChatGPT } from '@joliegg/ai';

const chatGPT = new ChatGPT('your-openai-api-key');

// Generate with DALL-E 3 (highest quality)
const image = await chatGPT.generate(
  'A yellow cat looking at a birthday cake',
  1, // number of images (DALL-E 3 only supports 1)
  '1024x1024', // size
  'dall-e-3' // model
);

// Generate with DALL-E 2 (multiple images possible)
const images = await chatGPT.generate(
  'A futuristic city skyline at sunset',
  4, // generate 4 variations
  '512x512', // smaller size for faster generation
  'dall-e-2'
);

// Generate with GPT Image 1 (auto size)
const image3 = await chatGPT.generate(
  'A watercolor painting of mountains in autumn',
  1,
  'auto', // automatic size selection
  'gpt-image-1'
);

// Generate portrait with DALL-E 3
const portrait = await chatGPT.generate(
  'A professional headshot of a software engineer',
  1,
  '1024x1792', // portrait aspect ratio
  'dall-e-3'
);

// Generate landscape with DALL-E 3
const landscape = await chatGPT.generate(
  'A panoramic view of a mountain range',
  1,
  '1792x1024', // landscape aspect ratio
  'dall-e-3'
);
```

#### Stability AI Dream

```javascript
import { Dream } from '@joliegg/ai';

// Initialize with different engines
const dreamUltra = new Dream('your-stability-api-key', 'ultra'); // highest quality
const dreamCore = new Dream('your-stability-api-key', 'core'); // balanced
const dreamSD3 = new Dream('your-stability-api-key', 'sd3'); // Stable Diffusion 3

// Generate image from text with fantasy style
const result = await dreamUltra.generate(
  'A magical forest with glowing mushrooms and fairy lights',
  1, // number of images
  '1024x1024', // size
  'fantasy-art', // style preset
  50, // steps
  7 // cfg scale
);

// Generate with different style presets
const animeResult = await dreamUltra.generate(
  'A cyberpunk city street at night',
  1,
  '1344x768', // ultra-wide landscape
  'anime', // anime style
  75, // more steps for better quality
  8 // higher cfg scale for stronger adherence
);

const photographicResult = await dreamUltra.generate(
  'A professional product photo of a modern smartphone',
  1,
  '1024x1024',
  'photographic', // realistic style
  30, // fewer steps for faster generation
  6 // lower cfg scale for more creative freedom
);

// Generate with different aspect ratios
const portraitResult = await dreamUltra.generate(
  'A portrait of a wise old wizard',
  1,
  '896x1152', // portrait aspect ratio
  'cinematic', // cinematic style
  50,
  7
);

const panoramicResult = await dreamUltra.generate(
  'A panoramic view of a mountain landscape',
  1,
  '1536x640', // panoramic landscape
  'enhance', // enhanced photography style
  60,
  7
);

// Generate image from existing image (image-to-image)
const imageBuffer = fs.readFileSync('input-image.png');
const result2 = await dreamUltra.generateFromImage(
  imageBuffer,
  'Make this image more vibrant and colorful with a sunset glow',
  0.35, // image strength (how much to preserve original)
  1,
  '1024x1024',
  'enhance' // enhance style for better results
);

// Image-to-image with different strength values
const strongEdit = await dreamUltra.generateFromImage(
  imageBuffer,
  'Transform this into a watercolor painting',
  0.8, // high strength = more creative changes
  1,
  '1024x1024',
  'digital-art'
);

const subtleEdit = await dreamUltra.generateFromImage(
  imageBuffer,
  'Slightly brighten the colors',
  0.1, // low strength = subtle changes
  1,
  '1024x1024',
  'enhance'
);
```

## Configuration Options

### Image Sizes

#### OpenAI DALL-E 2
- `256x256` - Small square
- `512x512` - Medium square
- `1024x1024` - Large square

#### OpenAI DALL-E 3
- `1024x1024` - Square
- `1024x1792` - Portrait
- `1792x1024` - Landscape

#### OpenAI GPT Image 1
- `1024x1024` - Square
- `1536x1024` - Landscape
- `1024x1536` - Portrait
- `auto` - Automatic size selection

#### Stability AI Dream
- `1024x1024` - Square
- `1152x896` - Landscape
- `896x1152` - Portrait
- `1216x832` - Wide landscape
- `832x1216` - Tall portrait
- `1344x768` - Ultra-wide landscape
- `768x1344` - Ultra-tall portrait
- `1536x640` - Panoramic landscape
- `640x1536` - Panoramic portrait

### Stability AI Style Presets

- `3d-model` - 3D rendered objects
- `analog-film` - Film photography style
- `anime` - Japanese animation style
- `cinematic` - Movie-like composition
- `comic-book` - Comic book art style
- `digital-art` - Digital painting
- `enhance` - Enhanced photography
- `fantasy-art` - Fantasy illustration
- `isometric` - Isometric 3D style
- `line-art` - Line drawing style
- `low-poly` - Low polygon 3D
- `modeling-compound` - 3D modeling style
- `neon-punk` - Cyberpunk neon style
- `origami` - Paper folding art
- `photographic` - Realistic photography
- `pixel-art` - Retro pixel graphics
- `tile-texture` - Seamless texture pattern

### Stability AI Aspect Ratios

- `16:9` - Widescreen landscape
- `1:1` - Square
- `21:9` - Ultra-wide landscape
- `2:3` - Portrait
- `3:2` - Landscape
- `4:5` - Portrait
- `5:4` - Landscape
- `9:16` - Mobile portrait
- `9:21` - Ultra-tall portrait

### Stability AI Engines

- `ultra` - Highest quality (default)
- `core` - Balanced quality and speed
- `sd3` - Stable Diffusion 3

### Model Names

#### OpenAI Chat Models
- `gpt-4o` - GPT-4 Omni (default)
- `gpt-4o-mini` - GPT-4 Omni Mini
- `gpt-4-turbo` - GPT-4 Turbo
- `gpt-3.5-turbo` - GPT-3.5 Turbo

#### OpenAI Image Models
- `dall-e-2` - DALL-E 2
- `dall-e-3` - DALL-E 3
- `gpt-image-1` - GPT Image 1 (default)

#### Google Gemini Models
- `gemini-2.5-pro` - Gemini 2.5 Pro (default)
- `gemini-2.0-pro` - Gemini 2.0 Pro
- `gemini-1.5-pro` - Gemini 1.5 Pro

#### DeepSeek Models
- `deepseek-chat` - DeepSeek Chat (default)
- `deepseek-coder` - DeepSeek Coder

### Generation Parameters

#### Stability AI Parameters
- **steps**: Number of generation steps (default: 50, range: 10-150)
- **scale**: CFG scale for prompt adherence (default: 7, range: 1-20)
- **imageStrength**: For image-to-image, how much to preserve original (default: 0.35, range: 0.0-1.0)

#### OpenAI Parameters
- **maxTokens**: Maximum tokens for chat completions (default: 300)
- **n**: Number of images to generate (default: 1, max: 10)


## License

This project is licensed under the Hippocratic License 3.0 - see the [LICENSE.md](LICENSE.md) file for details.