import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function uploadFileToUT(file: File): Promise<{ url: string; key: string; name: string }> {
  try {
    const response = await utapi.uploadFiles(file);
    
    if (response.error) {
      throw new Error(response.error.message);
    }

    return {
      url: response.data.url,
      key: response.data.key,
      name: response.data.name,
    };
  } catch (error) {
    console.error("UploadThing upload error:", error);
    throw new Error("Failed to upload file");
  }
}

export async function deleteFileFromUT(fileKey: string): Promise<void> {
  try {
    await utapi.deleteFiles(fileKey);
  } catch (error) {
    console.error("UploadThing deletion error:", error);
    throw new Error("Failed to delete file");
  }
}

export async function downloadFileFromUT(url: string): Promise<Blob> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }
    return await response.blob();
  } catch (error) {
    console.error("UploadThing download error:", error);
    throw new Error("Failed to download file");
  }
}

export { utapi };
