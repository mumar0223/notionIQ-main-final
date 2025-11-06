import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import sharp from "sharp";

export async function parseFile(file: Buffer, fileType: string) {
  try {
    if (fileType === "application/pdf") {
      const data = await pdfParse(file);
      return {
        text: data.text,
        pages: data.numpages,
        imageData: null,
      };
    } else if (
      fileType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ buffer: file });
      return {
        text: result.value,
        pages: null,
        imageData: null,
      };
    } else if (fileType.startsWith("image/")) {
      const base64 = file.toString("base64");
      const mimeType = fileType;
      return {
        text: "",
        pages: 1,
        imageData: {
          base64,
          mimeType,
        },
      };
    }

    return {
      text: "",
      pages: null,
      imageData: null,
    };
  } catch (error) {
    console.error("File parsing error:", error);
    return {
      text: "",
      pages: null,
      imageData: null,
    };
  }
}
