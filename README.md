[![Hippocratic License HL3-CL](https://img.shields.io/static/v1?label=Hippocratic%20License&message=HL3-CL&labelColor=5e2751&color=bc8c3d)](https://firstdonoharm.dev/version/3/0/cl.html)

# Chat AI

This library provides a unified interface for multiple AI providers including OpenAI, StabilityAI, Google Gemini, DeepSeek, and Grok for both chat completions and image generation.

## Installation

```bash
yarn add @joliegg/ai
```

## Quick Start

```javascript
import { ChatGPT, Dream, Gemini, DeepSeek, Grok } from '@joliegg/ai';

// Initialize with your API keys
const chatGPT = new ChatGPT(process.env.OPENAI_API_KEY);
const dream = new Dream(process.env.STABILITY_API_KEY);
const gemini = new Gemini(process.env.GOOGLE_API_KEY);
const deepSeek = new DeepSeek(process.env.DEEPSEEK_API_KEY);
const grok = new Grok(process.env.GROK_API_KEY);
```

## Chat Completions

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

console.log('DeepSeek Chat completion:', conversation.choices[0].message.content);
```

#### Grok

```javascript
import { Grok } from '@joliegg/ai';

const grok = new Grok('your-grok-api-key');

// Simple completion with default model
const completion = await grok.complete([
  { role: 'user', content: 'Write a creative short story about AI' }
]);

// Completion with custom model and token limit
const completion2 = await grok.complete([
  { role: 'user', content: 'Explain quantum entanglement in simple terms' }
], 'grok-4', 400);

// Chat conversation
const conversation = await grok.complete([
  { role: 'system', content: 'You are a witty and knowledgeable assistant.' },
  { role: 'user', content: 'What makes you different from other AI models?' },
  { role: 'assistant', content: 'I like to think I bring a bit more personality...' },
  { role: 'user', content: 'Tell me about your reasoning capabilities' }
], 'grok-4', 600);

console.log('Grok response:', completion.choices[0].message.content);
```

## Image Generation

#### OpenAI DALL-E

```javascript
import { ChatGPT } from '@joliegg/ai';

const chatGPT = new ChatGPT('your-openai-api-key');

// Generate with DALL-E 3 (highest quality)
const images = await chatGPT.generate({
  prompt: 'A yellow cat looking at a birthday cake',
  n: 1, // number of images (DALL-E 3 only supports 1)
  size: '1024x1024',
  model: 'dall-e-3',
  quality: 'standard',
  format: 'png',
  background: 'auto'
});

fs.writeFileSync('cat-cake.png', images[0]);

// Generate with DALL-E 2 (multiple images possible)
const images2 = await chatGPT.generate({
  prompt: 'A futuristic city skyline at sunset',
  n: 4, // generate 4 variations
  size: '512x512',
  model: 'dall-e-2',
  quality: 'standard',
  format: 'png',
  background: 'auto'
});

// Save all generated images
images2.forEach((buffer, index) => {
  fs.writeFileSync(`city-${index}.png`, buffer);
});

// Generate with GPT Image 1 (auto size)
const images3 = await chatGPT.generate({
  prompt: 'A watercolor painting of mountains in autumn',
  n: 1,
  size: 'auto', // automatic size selection
  model: 'gpt-image-1',
  quality: 'standard',
  format: 'png',
  background: 'auto'
});

// Generate portrait with DALL-E 3
const portrait = await chatGPT.generate({
  prompt: 'A professional headshot of a software engineer',
  n: 1,
  size: '1024x1792', // portrait aspect ratio
  model: 'dall-e-3',
  quality: 'high',
  format: 'png',
  background: 'auto'
});

// Generate landscape with DALL-E 3
const landscape = await chatGPT.generate({
  prompt: 'A panoramic view of a mountain range',
  n: 1,
  size: '1792x1024', // landscape aspect ratio
  model: 'dall-e-3',
  quality: 'high',
  format: 'webp',
  background: 'auto'
});
```

#### Stability AI Dream

```javascript
import { Dream } from '@joliegg/ai';

// Initialize with different engines
const dreamUltra = new Dream('your-stability-api-key', 'ultra'); // highest quality
const dreamCore = new Dream('your-stability-api-key', 'core'); // balanced
const dreamSD3 = new Dream('your-stability-api-key', 'sd3'); // Stable Diffusion 3

// Generate image from text with fantasy style
const image = await dreamUltra.generate({
  prompt: 'A magical forest with glowing mushrooms and fairy lights',
  aspectRatio: '1:1',
  style: 'fantasy-art',
  seed: 12345,
  outputFormat: 'png'
});

fs.writeFileSync('magical-forest.png', image);

// Generate with different style presets and aspect ratios
const animeImage = await dreamUltra.generate({
  prompt: 'A cyberpunk city street at night',
  aspectRatio: '21:9', // ultra-wide landscape
  style: 'anime',
  negativePrompt: 'blurry, low quality',
  outputFormat: 'webp'
});

const photographicImage = await dreamUltra.generate({
  prompt: 'A professional product photo of a modern smartphone',
  aspectRatio: '1:1',
  style: 'photographic',
  seed: 98765,
  outputFormat: 'jpeg'
});

// Generate portrait and panoramic images
const portraitImage = await dreamUltra.generate({
  prompt: 'A portrait of a wise old wizard',
  aspectRatio: '2:3', // portrait aspect ratio
  style: 'cinematic',
  negativePrompt: 'cartoon, anime'
});

const panoramicImage = await dreamUltra.generate({
  prompt: 'A panoramic view of a mountain landscape',
  aspectRatio: '21:9', // panoramic landscape
  style: 'enhance',
  outputFormat: 'webp'
});

// Generate using SD3 engine with advanced options
const sd3Image = await dreamSD3.generate({
  prompt: 'Futuristic cityscape at sunset',
  aspectRatio: '16:9',
  style: 'cinematic',
  cfgScale: 7, // SD3 only
  model: 'sd3.5-large-turbo', // SD3 only - choose specific variant
  seed: 54321,
  negativePrompt: 'dark, gloomy'
});

// Generate image from existing image (image-to-image)
const inputImageBuffer = fs.readFileSync('input-image.png');
const editedImage = await dreamUltra.generateFromImage({
  image: inputImageBuffer,
  prompt: 'Make this image more vibrant and colorful with a sunset glow',
  strength: 0.35, // how much to preserve original
  aspectRatio: '1:1',
  style: 'enhance',
  outputFormat: 'png'
});

// Save the edited image
fs.writeFileSync('enhanced-image.png', editedImage);

// Image-to-image with different strength values
const strongEdit = await dreamUltra.generateFromImage({
  image: inputImageBuffer,
  prompt: 'Transform this into a watercolor painting',
  strength: 0.8, // high strength = more creative changes
  aspectRatio: '1:1',
  style: 'digital-art',
  seed: 11111
});

const subtleEdit = await dreamUltra.generateFromImage({
  image: inputImageBuffer,
  prompt: 'Slightly brighten the colors',
  strength: 0.1, // low strength = subtle changes
  aspectRatio: '1:1',
  style: 'enhance',
  negativePrompt: 'oversaturated'
});

// SD3 image-to-image with advanced options
const sd3Edit = await dreamSD3.generateFromImage({
  image: inputImageBuffer,
  prompt: 'Convert to a futuristic sci-fi scene',
  strength: 0.6,
  aspectRatio: '16:9',
  style: 'cinematic',
  cfgScale: 8, // SD3 only
  model: 'sd3.5-large', // SD3 only
  negativePrompt: 'blurry, artifacts'
});
```

#### Grok Image Generation

```javascript
import { Grok } from '@joliegg/ai';

const grok = new Grok('your-grok-api-key');

// Generate single image with Grok
const images = await grok.generate({
  prompt: 'A futuristic robot exploring an alien planet with purple skies',
  n: 1,
  model: 'grok-2-image'
});

// images is now a Buffer[] - save the first image
fs.writeFileSync('robot-planet.png', images[0]);

// Generate multiple variations
const multipleImages = await grok.generate({
  prompt: 'Minimalist tech startup office design, modern and clean',
  n: 4, // Generate 4 variations
  model: 'grok-2-image'
});

// Save all generated images
multipleImages.forEach((buffer, index) => {
  fs.writeFileSync(`office-design-${index}.png`, buffer);
});

// Creative and artistic prompts
const artImage = await grok.generate({
  prompt: 'Abstract digital art representing the concept of artificial intelligence, vibrant colors and geometric patterns',
  n: 1,
  model: 'grok-2-image'
});

// Photorealistic scenes
const photoImage = await grok.generate({
  prompt: 'Photorealistic image of a cozy coffee shop on a rainy day, warm lighting, people reading books',
  n: 2,
  model: 'grok-2-image'
});

// Fantasy and sci-fi themes
const fantasyImages = await grok.generate({
  prompt: 'Epic fantasy landscape with floating islands, waterfalls, and magical creatures in the distance',
  n: 1,
  model: 'grok-2-image'
});

console.log('Generated', fantasyImages.length, 'fantasy images');
```

## Configuration Options

### OpenAI Image Generation Options

```typescript
export interface GenerateOptions {
  prompt: string;
  n: number;          // Number of images to generate
  size: Size;         // Image dimensions
  model: ImageGenerationModel;
  quality: Quality;   // Image quality
  format: OutputFormat; // Output format
  background: Background; // Background handling
}
```

#### Available Values:

**Sizes:**
- DALL-E 2: `'256x256' | '512x512' | '1024x1024'`
- DALL-E 3: `'1024x1024' | '1024x1792' | '1792x1024'`
- GPT Image 1: `'1024x1024' | '1536x1024' | '1024x1536' | 'auto'`

**Models:** `'gpt-image-1' | 'dall-e-3' | 'dall-e-2'`

**Quality:** `'standard' | 'hd'`

**Format:** `'png' | 'jpeg' | 'webp'`

**Background:** `'transparent' | 'opaque' | 'auto'`

### Grok Image Generation Options

```typescript
export interface GenerateOptions {
  prompt: string;
  n: number;          // Number of images to generate (max 10)
  model: ImageGenerationModel;
}
```

#### Available Values:

**Models:** `'grok-2-image'`

**Count:** 1 to 10 images per request

### Stability AI Generation Options

```typescript
export interface GenerateOptions {
  prompt: string;
  aspectRatio?: AspectRatio;
  style?: Style;
  seed?: number;
  negativePrompt?: string;
  outputFormat?: OutputFormat;
  // SD3 only parameters:
  cfgScale?: number;
  model?: SD3_Engine;
}

export interface ImageToImageOptions extends GenerateOptions {
  image: Buffer;
  strength?: number; // 0.0-1.0, how much to change the input
}
```

#### Available Values:

**Aspect Ratios:**
- `16:9` - Widescreen landscape
- `1:1` - Square
- `21:9` - Ultra-wide landscape
- `2:3` - Portrait
- `3:2` - Landscape
- `4:5` - Portrait
- `5:4` - Landscape
- `9:16` - Mobile portrait
- `9:21` - Ultra-tall portrait

**Styles:**
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

**Engines:**
- `ultra` - Highest quality (default)
- `core` - Balanced quality and speed
- `sd3` - Stable Diffusion 3

**SD3.5 Model Variants** (when using `sd3` engine):
- `sd3.5-large` - 8B parameters, highest quality (6.5 credits)
- `sd3.5-large-turbo` - Fast version of large (4 credits)  
- `sd3.5-medium` - 2.5B parameters, balanced (3.5 credits)

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

#### Grok Models
- `grok-4` - Grok 4 Chat (default)
- `grok-2-image` - Grok 2 Image Generation


### Engine-Specific Parameters

**SD3 Engine Only:**
- `cfgScale`: CFG scale for prompt adherence (range: 1-10)
- `model`: Choose SD3.5 variant (`'sd3.5-large' | 'sd3.5-large-turbo' | 'sd3.5-medium'`)

**All Engines:**
- `prompt`, `aspectRatio`, `style`, `seed`, `negativePrompt`, `outputFormat`

### Parameter Ranges

#### OpenAI
- **n**: 1 to 10 images (DALL-E 3 limited to 1)
- **maxTokens**: Maximum tokens for chat completions (default: 300)

#### Grok
- **n**: 1 to 10 images for image generation
- **maxTokens**: Maximum tokens for chat completions (default: 300)

#### Stability AI
- **seed**: 0 to 4294967294 (omit for random)
- **strength**: 0.0 to 1.0 (image-to-image only)
- **cfgScale**: 1 to 10 (SD3 only)


## License

This project is licensed under the Hippocratic License 3.0 - see the [LICENSE.md](LICENSE.md) file for details.