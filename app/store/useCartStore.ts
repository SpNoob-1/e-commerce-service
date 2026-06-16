import { create } from "zustand";
import { persist } from "zustand/middleware";

// 🧩 Definición de los tipos de datos para el carrito
export interface CartItem {
  id: number;
  nombre: string;
  precio: number;
  imagenUrl: string | null;
  tipo: "Físico" | "Servicio";
  // Propiedades específicas para productos físicos
  cantidadSeleccionada?: number;
  stockDisponible?: number;
  // Propiedades específicas para servicios
  fechaInicio?: string;
  fechaFin?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: number, tipo: "Físico" | "Servicio") => void;
  updateQuantity: (
    id: number,
    tipo: "Físico" | "Servicio",
    nuevaCantidad: number,
  ) => void; // 👈 1. Declarada en la interfaz
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  // El middleware 'persist' guarda automáticamente el carrito en LocalStorage 🔄
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        const currentItems = get().items;

        if (newItem.tipo === "Físico") {
          // Si es físico, vemos si ya existe para sumarle a la cantidad
          const existingItem = currentItems.find(
            (item) => item.id === newItem.id && item.tipo === "Físico",
          );

          if (existingItem) {
            set({
              items: currentItems.map((item) =>
                item.id === newItem.id && item.tipo === "Físico"
                  ? {
                      ...item,
                      cantidadSeleccionada:
                        (item.cantidadSeleccionada || 1) +
                        (newItem.cantidadSeleccionada || 1), // 👈 Mejorado: suma dinámicamente si le mandas más
                    }
                  : item,
              ),
            });
          } else {
            set({
              items: [
                ...currentItems,
                {
                  ...newItem,
                  cantidadSeleccionada: newItem.cantidadSeleccionada || 1,
                },
              ],
            });
          }
        } else {
          // Si es un servicio, se agrega individualmente ya que depende de sus fechas específicas
          set({ items: [...currentItems, newItem] });
        }
      },

      removeItem: (id, tipo) => {
        set({
          items: get().items.filter(
            (item) => !(item.id === id && item.tipo === tipo),
          ),
        });
      },

      // ⚡ 2. IMPLEMENTACIÓN DE LA FUNCIÓN PARA CAMBIAR CANTIDADES
      updateQuantity: (id, tipo, nuevaCantidad) => {
        set({
          items: get().items.map((item) =>
            item.id === id && item.tipo === tipo
              ? { ...item, cantidadSeleccionada: nuevaCantidad }
              : item,
          ),
        });
      },

      clearCart: () => set({ items: [] }),
    }),
    {
      name: "shopping-cart-storage", // Nombre de la llave en el LocalStorage
    },
  ),
);
