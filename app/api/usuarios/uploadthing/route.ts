import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

// Expone los métodos GET y POST para que UploadThing se comunique con el frontend
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
