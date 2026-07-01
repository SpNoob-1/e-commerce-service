import {
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";

import type { OurFileRouter } from "@/app/api/usuarios/uploadthing/core";

export const UploadButton = generateUploadButton<OurFileRouter>({
  url: "/api/usuarios/uploadthing",
});
export const UploadDropzone = generateUploadDropzone<OurFileRouter>({
  url: "/api/usuarios/uploadthing",
});
