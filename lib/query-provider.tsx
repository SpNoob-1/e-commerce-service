"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Creamos el QueryClient dentro de un estado para evitar que se recree en cada renderizado
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // Los datos se consideran "frescos" por 5 minutos
            refetchOnWindowFocus: false, // Evita recargar la API cada vez que cambias de pestaña
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
