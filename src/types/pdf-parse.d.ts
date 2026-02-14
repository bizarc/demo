declare module 'pdf-parse' {
    interface PdfData {
        text: string;
        numpages: number;
        numrender: number;
        info: Record<string, unknown>;
        metadata: Record<string, unknown> | null;
        version: string;
    }

    function pdf(
        dataBuffer: Buffer,
        options?: { pwd?: string; max?: number }
    ): Promise<PdfData>;

    export = pdf;
}
