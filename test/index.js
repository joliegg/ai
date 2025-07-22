require('dotenv').config();

const fs = require('fs');

const { ChatGPT, Dream, DeepSeek, Grok, Claude } = require('./../dist');

const { OPEN_AI_API_KEY, STABILITY_AI_API_KEY, DEEPSEEK_API_KEY, GROK_API_KEY, CLAUDE_API_KEY } = process.env;

const chatGPT = new ChatGPT(OPEN_AI_API_KEY);
const deepSeek = new DeepSeek(DEEPSEEK_API_KEY);
const dream = new Dream(STABILITY_AI_API_KEY);
const grok = new Grok(GROK_API_KEY);
const claude = new Claude(CLAUDE_API_KEY);

(async () => {

  const gptCompletion = await chatGPT.complete([{ role: 'user', content: 'Describe yourself in 5 words' }], 'gpt-4o');
  console.log(gptCompletion);

  const deepSeekCompletion = await deepSeek.complete([{ role: 'user', content: 'Describe yourself in 5 words' }], 'deepseek-chat');
  console.log(deepSeekCompletion);

  const grokCompletion = await grok.complete([{ role: 'user', content: 'Describe yourself in 5 words' }], 'grok-4');
  console.log(grokCompletion);

  const claudeCompletion = await claude.complete([{ role: 'user', content: 'Describe yourself in 5 words' }], 'claude-3-5-sonnet-20240620');
  console.log(claudeCompletion);

  const openAIImages = await chatGPT.generate({
    prompt: 'A yellow cat looking at a birthday cake, photorealistic style',
    n: 1,
    size: '1024x1024',
    model: 'dall-e-3',
    quality: 'standard',
    format: 'png',
    background: 'auto'
  });

  fs.writeFileSync('./dall-e-3.png', openAIImages[0]);

  const dalle2Images = await chatGPT.generate({
    prompt: 'Abstract geometric patterns in bright colors',
    n: 2,
    size: '512x512',
    model: 'dall-e-2',
    quality: 'standard',
    format: 'png',
    background: 'auto'
  });

  fs.writeFileSync('./dall-e-2-1.png', dalle2Images[0]);
  fs.writeFileSync('./dall-e-2-2.png', dalle2Images[1]);

 
  const grokImages = await grok.generate({
    prompt: 'A futuristic robot exploring an alien planet with purple skies',
    n: 1,
    model: 'grok-2-image'
  });

  fs.writeFileSync('./grok-2-image.png', grokImages[0]);

  // Test Grok with multiple images
  const grokMultiImages = await grok.generate({
    prompt: 'Minimalist tech startup office design, modern and clean',
    n: 3,
    model: 'grok-2-image'
  });

  fs.writeFileSync('./grok-2-image-1.png', grokMultiImages[0]);
  fs.writeFileSync('./grok-2-image-2.png', grokMultiImages[1]);
  fs.writeFileSync('./grok-2-image-3.png', grokMultiImages[2]);

  const stabilityImage = await dream.generate({
    prompt: 'A majestic dragon soaring through clouds at sunset',
    aspectRatio: '16:9',
    style: 'fantasy-art',
    seed: 12345,
    negativePrompt: 'blurry, low quality, cartoon',
    outputFormat: 'png'
  });

  fs.writeFileSync('./stability-image.png', stabilityImage);

  const portraitImage = await dream.generate({
    prompt: 'Portrait of a wise elderly wizard with glowing eyes',
    aspectRatio: '2:3',
    style: 'cinematic',
    seed: 98765,
    outputFormat: 'webp'
  });

  fs.writeFileSync('./stability-image-portrait.png', portraitImage);

  const landscapeImage = await dream.generate({
    prompt: 'Vast alien landscape with two moons in the sky',
    aspectRatio: '21:9',
    style: 'photographic',
    negativePrompt: 'earth, familiar',
    outputFormat: 'jpeg'
  });

  fs.writeFileSync('./stability-image-landscape.png', landscapeImage);
 
  const dreamSD3 = new Dream(STABILITY_AI_API_KEY, 'sd3');
  const sd3Image = await dreamSD3.generate({
    prompt: 'Futuristic cyberpunk cityscape with neon lights',
    aspectRatio: '16:9',
    style: 'cinematic',
    cfgScale: 7,              
    model: 'sd3.5-large-turbo',
    seed: 54321,
    negativePrompt: 'blurry, artifacts, low quality'
  });

  fs.writeFileSync('./stability-image-sd3.png', sd3Image);

  const inputBuffer = fs.readFileSync('./stability-image-sd3.png');
  const editedImage = await dream.generateFromImage({
    image: inputBuffer,
    prompt: 'Transform this into a magical fantasy scene',
    strength: 0.7,
    aspectRatio: '1:1',
    style: 'fantasy-art',
    seed: 11111,
    negativePrompt: 'realistic, modern'
  });

  fs.writeFileSync('./stability-image-sd3-edited.png', editedImage);

  const conversation = await chatGPT.converse('gpt-4o-realtime-preview');

  conversation.on('message', (message) => {
    const event = JSON.parse(message.toString());

    console.log(event);

    const { type } = event;

    if (type === 'session.created') {
      conversation.send(JSON.stringify({
        type: 'session.update',
        session: {
          modalities: ['text'],
          instructions: 'You are a helpful assistant that can answer questions and help with tasks.',
        }
      }));
    }

    if (type === 'session.updated') {
      conversation.send(JSON.stringify({
        type: 'response.create',
        response: {
          instructions: 'You are a helpful cat assistant that can answer questions and help with tasks. You are also a cat.',
          // Message history in order.
          input: [
            {
              type: 'message',
              role: 'user',
              content: [
                {
                  type: 'input_text',
                  text: 'Hello, my name is Diana',
                },
              ]
            },
            {
              type: 'message',
              role: 'user',
              content: [
                {
                  type: 'input_text',
                  text: 'What is my name? Also, can you explain me the difference between a cat and a dog? And what is the capital of France?',
                }
              ]
            },
          ]
        }
      }));
    }

    if (type === 'response.done') {
      console.log(event.response.output[0].content[0].text);
    }
  });

  conversation.on('error', (error) => {
    console.error(error);
  });

  conversation.on('close', () => {
    console.log('Connection closed');
  });

  conversation.on('open', () => {
    console.log('Connection opened');
  });

})();


