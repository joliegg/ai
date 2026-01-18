require('dotenv').config();

const fs = require('fs');

const {
  ChatGPT,
  Dream,
  DeepSeek,
  Grok,
  Claude,
  Gemini,
  createConversation,
  createMessageBuilder,
  imageFromBuffer,
  imageFromFile,
  withImages,
  text,
} = require('./../dist');

const { OPEN_AI_API_KEY, STABILITY_AI_API_KEY, DEEPSEEK_API_KEY, GROK_API_KEY, CLAUDE_API_KEY, GOOGLE_API_KEY } =
  process.env;

const chatGPT = new ChatGPT(OPEN_AI_API_KEY);
const deepSeek = new DeepSeek(DEEPSEEK_API_KEY);
const dream = new Dream(STABILITY_AI_API_KEY);
const grok = new Grok(GROK_API_KEY);
const claude = new Claude(CLAUDE_API_KEY);
const gemini = GOOGLE_API_KEY ? new Gemini(GOOGLE_API_KEY) : null;

// =============================================================================
// Helper to run tests with error handling
// =============================================================================

async function runTest(name, fn) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 TEST: ${name}`);
  console.log('='.repeat(60));

  try {
    await fn();
    console.log(`✅ PASSED: ${name}`);
  } catch (error) {
    console.error(`❌ FAILED: ${name}`);
    console.error(error);
  }
}

// =============================================================================
// Main Test Suite
// =============================================================================

(async () => {
  // ===========================================================================
  // Chat Completions - Fixed API signatures
  // ===========================================================================

  await runTest('ChatGPT completion', async () => {
    const result = await chatGPT.complete([{ role: 'user', content: 'Describe yourself in 5 words' }], {
      model: 'gpt-4o',
    });
    console.log('Response:', result.content);
    console.log('Usage:', result.usage);
  });

  await runTest('DeepSeek completion', async () => {
    const result = await deepSeek.complete([{ role: 'user', content: 'Describe yourself in 5 words' }], {
      model: 'deepseek-chat',
    });
    console.log('Response:', result.content);
  });

  await runTest('Grok completion', async () => {
    const result = await grok.complete([{ role: 'user', content: 'Describe yourself in 5 words' }], {
      model: 'grok-4',
    });
    console.log('Response:', result.content);
  });

  await runTest('Claude completion', async () => {
    const result = await claude.complete([{ role: 'user', content: 'Describe yourself in 5 words' }], {
      model: 'claude-3-5-sonnet-20240620',
    });
    console.log('Response:', result.content);
  });

  if (gemini) {
    await runTest('Gemini completion', async () => {
      const result = await gemini.complete([{ role: 'user', content: 'Describe yourself in 5 words' }], {
        model: 'gemini-2.5-pro',
      });
      console.log('Response:', result.content);
    });
  }

  // ===========================================================================
  // Streaming
  // ===========================================================================

  await runTest('ChatGPT streaming', async () => {
    let response = '';
    for await (const chunk of chatGPT.stream([{ role: 'user', content: 'Count from 1 to 5' }], {
      model: 'gpt-4o',
    })) {
      if (chunk.delta.content) {
        response += chunk.delta.content;
        process.stdout.write(chunk.delta.content);
      }
    }
    console.log('\nFull response:', response);
  });

  // ===========================================================================
  // Image Generation
  // ===========================================================================

  await runTest('DALL-E 3 image generation', async () => {
    const images = await chatGPT.generate({
      prompt: 'A yellow cat looking at a birthday cake, photorealistic style',
      n: 1,
      size: '1024x1024',
      model: 'dall-e-3',
      quality: 'standard',
      format: 'png',
      background: 'auto',
    });
    fs.writeFileSync('./dall-e-3.png', images[0]);
    console.log('Saved to dall-e-3.png');
  });

  await runTest('DALL-E 2 image generation (multiple)', async () => {
    const images = await chatGPT.generate({
      prompt: 'Abstract geometric patterns in bright colors',
      n: 2,
      size: '512x512',
      model: 'dall-e-2',
      quality: 'standard',
      format: 'png',
      background: 'auto',
    });
    fs.writeFileSync('./dall-e-2-1.png', images[0]);
    fs.writeFileSync('./dall-e-2-2.png', images[1]);
    console.log('Saved 2 images');
  });

  await runTest('Grok image generation', async () => {
    const images = await grok.generate({
      prompt: 'A futuristic robot exploring an alien planet with purple skies',
      n: 1,
      model: 'grok-2-image',
    });
    fs.writeFileSync('./grok-2-image.png', images[0]);
    console.log('Saved to grok-2-image.png');
  });

  await runTest('Stability AI image generation', async () => {
    const image = await dream.generate({
      prompt: 'A majestic dragon soaring through clouds at sunset',
      aspectRatio: '16:9',
      style: 'fantasy-art',
      seed: 12345,
      negativePrompt: 'blurry, low quality, cartoon',
      outputFormat: 'png',
    });
    fs.writeFileSync('./stability-image.png', image);
    console.log('Saved to stability-image.png');
  });

  // ===========================================================================
  // Embeddings
  // ===========================================================================

  await runTest('OpenAI embeddings', async () => {
    const result = await chatGPT.embed('Hello, world!');
    console.log('Embedding dimensions:', result.embeddings[0].length);
    console.log('First 5 values:', result.embeddings[0].slice(0, 5));
  });

  if (gemini) {
    await runTest('Gemini embeddings', async () => {
      const result = await gemini.embed('Hello, world!');
      console.log('Embedding dimensions:', result.embeddings[0].length);
      console.log('First 5 values:', result.embeddings[0].slice(0, 5));
    });
  }

  // ===========================================================================
  // Token Counting
  // ===========================================================================

  await runTest('Token counting', async () => {
    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello, how are you doing today?' },
    ];
    const result = chatGPT.countTokens(messages);
    console.log('Token estimate:', result);
  });

  // ===========================================================================
  // Model Listing
  // ===========================================================================

  await runTest('List OpenAI models', async () => {
    const result = await chatGPT.listModels();
    console.log('Total models:', result.models.length);
    console.log(
      'First 5 models:',
      result.models.slice(0, 5).map((m) => m.id)
    );
  });

  // ===========================================================================
  // Content Moderation
  // ===========================================================================

  await runTest('Content moderation', async () => {
    const result = await chatGPT.moderate(['This is a friendly message', 'I love programming']);
    console.log('Results:');
    result.forEach((r, i) => {
      console.log(`  Message ${i + 1}: flagged=${r.flagged}`);
    });
  });

  // ===========================================================================
  // Batch Processing
  // ===========================================================================

  await runTest('Batch processing', async () => {
    const requests = [
      { id: '1', messages: [{ role: 'user', content: 'Say hello' }] },
      { id: '2', messages: [{ role: 'user', content: 'Say goodbye' }] },
      { id: '3', messages: [{ role: 'user', content: 'Say thank you' }] },
    ];

    const results = await chatGPT.completeBatch(requests, { model: 'gpt-4o-mini' }, 2);
    console.log('Batch results:');
    results.forEach((r) => {
      if (r.response) {
        console.log(`  ${r.id}: ${r.response.content?.slice(0, 50)}...`);
      } else {
        console.log(`  ${r.id}: ERROR - ${r.error?.message}`);
      }
    });
  });

  // ===========================================================================
  // Conversation Manager
  // ===========================================================================

  await runTest('Conversation manager', async () => {
    const conversation = createConversation(chatGPT, {
      systemPrompt: 'You are a helpful assistant. Be concise.',
      model: 'gpt-4o-mini',
      maxHistory: 10,
    });

    const response1 = await conversation.send('My name is Alice');
    console.log('Response 1:', response1.content);

    const response2 = await conversation.send('What is my name?');
    console.log('Response 2:', response2.content);

    console.log('History length:', conversation.length);

    // Test fork
    const forked = conversation.fork();
    const response3 = await forked.send('Tell me a joke');
    console.log('Forked response:', response3.content);
    console.log('Original length:', conversation.length);
    console.log('Forked length:', forked.length);
  });

  // ===========================================================================
  // Message Builder
  // ===========================================================================

  await runTest('Message builder', async () => {
    const builder = createMessageBuilder();

    builder.system('You are a helpful assistant.').user('Hello!').assistant('Hi there! How can I help you?');

    const messages = builder.build();
    console.log('Built messages:', messages.length);
    console.log(
      'Roles:',
      messages.map((m) => m.role)
    );

    // Test completion with built messages
    builder.user('What is 2+2?');
    const response = await chatGPT.complete(builder.build(), { model: 'gpt-4o-mini' });
    console.log('Response:', response.content);
  });

  // ===========================================================================
  // Vision/Multimodal (if test image exists)
  // ===========================================================================

  if (fs.existsSync('./dall-e-3.png')) {
    await runTest('Vision with image file', async () => {
      const imageContent = imageFromFile('./dall-e-3.png');
      const messages = [
        {
          role: 'user',
          content: withImages('What do you see in this image? Describe it briefly.', imageContent),
        },
      ];

      const response = await chatGPT.complete(messages, { model: 'gpt-4o' });
      console.log('Vision response:', response.content);
    });
  }

  // ===========================================================================
  // Text-to-Speech (optional - creates audio file)
  // ===========================================================================

  await runTest('Text-to-speech', async () => {
    const audioBuffer = await chatGPT.speak('Hello! This is a test of text to speech.', {
      voice: 'nova',
      model: 'tts-1',
    });
    fs.writeFileSync('./tts-output.mp3', audioBuffer);
    console.log('Saved to tts-output.mp3, size:', audioBuffer.length, 'bytes');
  });

  // ===========================================================================
  // Audio Transcription (if audio file exists)
  // ===========================================================================

  if (fs.existsSync('./tts-output.mp3')) {
    await runTest('Audio transcription', async () => {
      const result = await chatGPT.transcribe('./tts-output.mp3', {
        responseFormat: 'verbose_json',
      });
      console.log('Transcription:', result.text);
      console.log('Language:', result.language);
      console.log('Duration:', result.duration);
    });
  }

  // ===========================================================================
  // Gemini-specific features
  // ===========================================================================

  if (gemini) {
    await runTest('Gemini Imagen generation', async () => {
      try {
        const result = await gemini.generateImage({
          prompt: 'A cute robot holding a flower in a garden',
          numberOfImages: 1,
          aspectRatio: '1:1',
        });
        if (result.images && result.images.length > 0) {
          fs.writeFileSync('./gemini-imagen.png', result.images[0]);
          console.log('Saved to gemini-imagen.png');
        }
      } catch (error) {
        console.log('Imagen not available:', error.message);
      }
    });
  }

  // ===========================================================================
  // File Management
  // ===========================================================================

  await runTest('File management', async () => {
    // List existing files
    const fileList = await chatGPT.listFiles();
    console.log('Current files:', fileList.files.length);

    // Note: File upload requires a valid purpose
    // Example (uncomment to test):
    // const uploaded = await chatGPT.uploadFile('./test-file.txt', { purpose: 'assistants' });
    // console.log('Uploaded:', uploaded.id);
    // await chatGPT.deleteFile(uploaded.id);
  });

  // ===========================================================================
  // Realtime Conversation (RealtimeSession API)
  // ===========================================================================

  await runTest('Realtime conversation', async () => {
    return new Promise((resolve, reject) => {
      const session = chatGPT.createRealtimeSession({
        model: 'gpt-4o-realtime-preview',
        instructions: 'You are a helpful assistant. Be brief.',
      });

      const timeout = setTimeout(() => {
        session.close();
        reject(new Error('Realtime conversation timed out'));
      }, 30000);

      session.on('session.updated', () => {
        console.log('Session configured, sending message...');
        session.sendText('Say hello in one word');
      });

      session.on('response.done', (event) => {
        clearTimeout(timeout);
        const text = event.response?.output?.[0]?.content?.[0]?.text;
        console.log('Response:', text);
        session.close();
        resolve();
      });

      session.on('error', (event) => {
        clearTimeout(timeout);
        reject(event.error);
      });

      // Connect to start the session
      session.connect().catch(reject);
    });
  });

  // ===========================================================================
  // Sora-2 Video Generation (Optional - requires API access)
  // ===========================================================================

  // Note: Uncomment to test video generation if you have access
  /*
  await runTest('Sora-2 video generation', async () => {
    console.log('Starting video generation...');
    const video = await chatGPT.generateVideoAndWait({
      prompt: 'A cat playing with a ball of yarn in slow motion',
      model: 'sora-2',
      size: '1280x720',
      seconds: 4,
    }, 5000, 600000);

    console.log('Video generated:', video.id);
    console.log('URL:', video.videoUrl);

    if (video.videoUrl) {
      const buffer = await chatGPT.downloadVideo(video.videoUrl);
      fs.writeFileSync('./sora-video.mp4', buffer);
      console.log('Saved to sora-video.mp4');
    }
  });
  */

  // ===========================================================================
  // Tool/Function Calling
  // ===========================================================================

  await runTest('Function calling', async () => {
    const tools = [
      {
        name: 'get_weather',
        description: 'Get the current weather for a location',
        parameters: {
          type: 'object',
          properties: {
            location: { type: 'string', description: 'City name' },
            unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },
          },
          required: ['location'],
        },
      },
    ];

    const response = await chatGPT.complete([{ role: 'user', content: 'What is the weather in Tokyo?' }], {
      model: 'gpt-4o',
      tools,
      toolChoice: 'auto',
    });

    console.log('Content:', response.content);
    console.log('Tool calls:', response.toolCalls);

    if (response.toolCalls && response.toolCalls.length > 0) {
      console.log('Function name:', response.toolCalls[0].name);
      console.log('Arguments:', response.toolCalls[0].arguments);
    }
  });

  // ===========================================================================
  // Summary
  // ===========================================================================

  console.log(`\n${'='.repeat(60)}`);
  console.log('🎉 All tests completed!');
  console.log('='.repeat(60));
})();
