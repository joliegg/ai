require('dotenv').config();

const { ChatGPT, Dream } = require('./../dist');

const { OPEN_AI_API_KEY, STABILITY_AI_API_KEY } = process.env;


const chatGPT = new ChatGPT(OPEN_AI_API_KEY);

const dream = new Dream(STABILITY_AI_API_KEY);


(async () => {

  const completion = await chatGPT.complete([{ role: 'user', content: 'Describe yourself in 5 words' }], 'gpt-4-vision-preview');

  console.log(completion);

  const image1 = await chatGPT.generate('Yellow cat looking at a cake', 1, '1024x1024');

  console.log(image1);

  const image3 = await chatGPT.generate('Yellow cat looking at a cake', 1, '1024x1024', 'dall-e-2');

  console.log(image3);

  const image2 = await dream.generate('Yellow cat looking at a cake', 2, '1024x1024');

  console.log(image2);

})();


