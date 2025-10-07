declare module 'pdf-poppler' {
  interface ConvertOptions {
    format?: string;
    out_dir?: string;
    out_prefix?: string;
    page?: number | null;
    scale?: number;
  }

  function convert(filePath: string, options: ConvertOptions): Promise<string[]>;

  export default { convert };
}