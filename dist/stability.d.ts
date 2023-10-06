export type Style = '3d-model' | 'analog-film' | 'anime' | 'cinematic' | 'comic-book' | 'digital-art' | 'enhance' | 'fantasy-art' | 'isometric' | 'line-art' | 'low-poly' | 'modeling-compound' | 'neon-punk' | 'origami' | 'photographic' | 'pixel-art' | 'tile-texture';
export type Size = '1024x1024' | '1152x896' | '896x1152' | '1216x832' | '832x1216' | '1344x768' | '768x1344' | '1536x640' | '640x1536';
export interface DreamResponse {
    base64: string;
    finishReason: string;
    seed: number;
}
declare class Dream {
    private _apiKey?;
    private _engine?;
    constructor(apiKey: string, engine?: string);
    generate(prompt: string, n: number | undefined, size: Size, style?: Style, steps?: number, scale?: number): Promise<DreamResponse[]>;
    generateFromImage(image: string, prompt: string, imageStrength: number | undefined, n: number | undefined, size: Size, style?: Style, steps?: number, scale?: number): Promise<DreamResponse[]>;
}
export default Dream;
