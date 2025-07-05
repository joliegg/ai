export type Style = '3d-model' | 'analog-film' | 'anime' | 'cinematic' | 'comic-book' | 'digital-art' | 'enhance' | 'fantasy-art' | 'isometric' | 'line-art' | 'low-poly' | 'modeling-compound' | 'neon-punk' | 'origami' | 'photographic' | 'pixel-art' | 'tile-texture';
export type Size = '1024x1024' | '1152x896' | '896x1152' | '1216x832' | '832x1216' | '1344x768' | '768x1344' | '1536x640' | '640x1536';
export type AspectRatio = '16:9' | '1:1' | '21:9' | '2:3' | '3:2' | '4:5' | '5:4' | '9:16' | '9:21';
export type Engine = 'ultra' | 'core' | 'sd3';
export interface DreamResponse {
    base64: string;
    finishReason: string;
    seed: number;
}
export interface DreamArtifact {
    base64: string;
    finishReason: string;
    seed: number;
}
declare class Dream {
    private _apiKey?;
    private _engine?;
    constructor(apiKey: string, engine?: Engine);
    generate(prompt: string, n?: number, size?: Size, style?: Style | null, steps?: number, scale?: number): Promise<{
        artifacts: DreamArtifact[];
    }>;
    generateFromImage(image: Buffer, prompt: string, imageStrength?: number, n?: number, size?: Size, style?: Style | null, steps?: number, scale?: number): Promise<{
        artifacts: DreamArtifact[];
    }>;
}
export default Dream;
