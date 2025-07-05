import { GenerateContentResult, GoogleGenerativeAI, Part, StartChatParams } from '@google/generative-ai';

class Gemini {
  private _client: GoogleGenerativeAI;


  constructor(apiKey: string) {
    this._client = new GoogleGenerativeAI(apiKey);

  }

  complete (prompt: string | (string | Part)[], startParams: StartChatParams | null | undefined = null, model: string = 'gemini-2.5-pro'): Promise<GenerateContentResult> {
    if (this._client instanceof GoogleGenerativeAI === false) {
      throw new Error('GoogleGenerativeAI client not initialized');
    }

    const _model = this._client.getGenerativeModel({ model });

    if (startParams !== null && typeof startParams !== 'undefined') {
      const chat = _model.startChat(startParams);
      return chat.sendMessage(prompt);
    }

    return _model.generateContent(prompt);
  }
}

export default Gemini;