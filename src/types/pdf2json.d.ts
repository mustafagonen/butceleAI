declare module 'pdf2json' {
    import { EventEmitter } from 'events';

    class PDFParser extends EventEmitter {
        constructor(context?: any, needRawText?: number);
        parseBuffer(buffer: Buffer): void;
        getRawTextContent(): string;
        loadPDF(pdfFilePath: string, verbosity?: number): void;
    }

    export default PDFParser;
}
