require('dotenv').config();

const { ChatGPT, Dream, DeepSeek } = require('./../dist');

const { OPEN_AI_API_KEY, STABILITY_AI_API_KEY, DEEPSEEK_API_KEY } = process.env;

const chatGPT = new ChatGPT(OPEN_AI_API_KEY);
const deepSeek = new DeepSeek(DEEPSEEK_API_KEY);
const dream = new Dream(STABILITY_AI_API_KEY);

(async () => {

  // const completion = await chatGPT.complete([{ role: 'user', content: 'Describe yourself in 5 words' }], 'gpt-4o');

  // console.log(completion);

  // const completion2 = await deepSeek.complete([{ role: 'user', content: 'Describe yourself in 5 words' }], 'deepseek-chat');

  // console.log(completion2);

  // const image1 = await chatGPT.generate('Yellow cat looking at a cake', 1, '1024x1024');

  // console.log(image1);

  // const image3 = await chatGPT.generate('Yellow cat looking at a cake', 1, '1024x1024', 'dall-e-2');

  // console.log(image3);

  // const image2 = await dream.generate('Yellow cat looking at a cake');

  // console.log(image2);

  const conversation = await chatGPT.converse('gpt-4o-realtime-preview');

  conversation.on('message', (message) => {
    const event = JSON.parse(message.toString());

    // console.log(event);

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


