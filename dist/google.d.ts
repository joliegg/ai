import { GenerateContentResult, Part, StartChatParams } from '@google/generative-ai';
declare class Gemini {
    private _client;
    constructor(apiKey: string);
    complete(prompt: string | (string | Part)[], startParams?: StartChatParams | null | undefined, model?: string): Promise<GenerateContentResult>;
}
export default Gemini;
