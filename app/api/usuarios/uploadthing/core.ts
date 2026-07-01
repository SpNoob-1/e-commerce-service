import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

// Define tu FileRouter: Controla las reglas de subida
export const ourFileRouter = {
  // Definimos un endpoint para imágenes de productos (máximo 4MB)
  imageUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  }).onUploadComplete(async ({ metadata, file }) => {
    console.log("File upload complete for userId:", metadata);
    console.log("file url", file.url);
    return { uploadedBy: "Admin" };
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
