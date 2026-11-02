declare module "xlsx-preview" {
  type PreviewOptions = {
    output?: "string" | "arrayBuffer";
    separateSheets?: boolean;
    minimumRows?: number;
    minimumCols?: number;
  };

  const xlsxPreview: {
    xlsx2Html(
      data: File | Blob | ArrayBuffer,
      options?: PreviewOptions
    ): Promise<string | string[] | ArrayBuffer | ArrayBuffer[]>;
  };

  export default xlsxPreview;
}
