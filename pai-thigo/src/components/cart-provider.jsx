"use client";

import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "paithiago-cart-v2";
const CartContext = createContext(null);

function normalizePortionSize(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return ["small", "medium", "large"].includes(normalized) ? normalized : "medium";
}

function buildCartLineId(menuItemId, portionSize) {
  return `${menuItemId}::${portionSize}`;
}

function sanitizeCartItems(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const stockQuantity = Number(item.stockQuantity ?? NaN);
      const lowStockThreshold = Number(item.lowStockThreshold ?? NaN);

      return {
        menuItemId: String(item.menuItemId ?? "").trim(),
        name: String(item.name ?? "").trim(),
        price: Number(item.price ?? 0),
        prepTime: String(item.prepTime ?? "").trim(),
        signature: Boolean(item.signature),
        portionSize: normalizePortionSize(item.portionSize),
        quantity: Number(item.quantity ?? 1),
        notes: String(item.notes ?? "").trim(),
        stockQuantity:
          Number.isFinite(stockQuantity) && stockQuantity >= 0
            ? stockQuantity
            : null,
        lowStockThreshold:
          Number.isFinite(lowStockThreshold) && lowStockThreshold >= 0
            ? lowStockThreshold
            : 0,
      };
    })
    .map((item) => ({
      ...item,
      lineId: buildCartLineId(item.menuItemId, item.portionSize),
    }))
    .filter(
      (item) =>
        item.menuItemId &&
        item.name &&
        Number.isFinite(item.price) &&
        Number.isFinite(item.quantity) &&
        item.quantity >= 1 &&
        item.quantity <= 20 &&
        (item.stockQuantity == null || item.quantity <= item.stockQuantity),
    );
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(STORAGE_KEY);
      if (storedValue) {
        setItems(sanitizeCartItems(JSON.parse(storedValue)));
      }
    } catch {
      setItems([]);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [isHydrated, items]);

  const value = useMemo(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0,
    );

    return {
      items,
      itemCount,
      totalPrice,
      isHydrated,
      addItem(item) {
        const normalizedItem = sanitizeCartItems([item])[0];

        if (!normalizedItem) {
          return { ok: false, reason: "invalid_item" };
        }

        const hasStockControl =
          Number.isFinite(normalizedItem.stockQuantity) &&
          normalizedItem.stockQuantity >= 0;
        const currentItemQuantity = items
          .filter((cartItem) => cartItem.menuItemId === normalizedItem.menuItemId)
          .reduce((total, cartItem) => total + cartItem.quantity, 0);
        const remainingStockForItem = hasStockControl
          ? Math.max(0, normalizedItem.stockQuantity - currentItemQuantity)
          : 20;

        if (hasStockControl && remainingStockForItem <= 0) {
          return {
            ok: false,
            reason: "stock_limit",
            addedQuantity: 0,
            remainingStock: 0,
          };
        }

        const quantityToAdd = Math.max(
          1,
          Math.min(
            normalizedItem.quantity,
            hasStockControl ? remainingStockForItem : 20,
          ),
        );

        startTransition(() => {
          setItems((currentItems) => {
            const existingItem = currentItems.find(
              (currentItem) => currentItem.lineId === normalizedItem.lineId,
            );

            if (!existingItem) {
              return [
                ...currentItems,
                {
                  ...normalizedItem,
                  quantity: quantityToAdd,
                },
              ];
            }

            const sameItemQuantityWithoutCurrentLine = currentItems
              .filter(
                (currentItem) =>
                  currentItem.menuItemId === normalizedItem.menuItemId &&
                  currentItem.lineId !== existingItem.lineId,
              )
              .reduce((total, currentItem) => total + currentItem.quantity, 0);
            const maxAllowedForCurrentLine = hasStockControl
              ? Math.max(
                  0,
                  Math.min(
                    20,
                    normalizedItem.stockQuantity - sameItemQuantityWithoutCurrentLine,
                  ),
                )
              : 20;

            if (maxAllowedForCurrentLine <= 0) {
              return currentItems;
            }

            return currentItems.map((currentItem) =>
              currentItem.lineId === normalizedItem.lineId
                ? {
                    ...currentItem,
                    quantity: Math.min(
                      currentItem.quantity + quantityToAdd,
                      maxAllowedForCurrentLine,
                    ),
                    notes: normalizedItem.notes || currentItem.notes,
                    stockQuantity: normalizedItem.stockQuantity,
                    lowStockThreshold: normalizedItem.lowStockThreshold,
                  }
                : currentItem,
            );
          });
        });

        return {
          ok: true,
          reason: "added",
          addedQuantity: quantityToAdd,
          remainingStock: hasStockControl
            ? Math.max(0, remainingStockForItem - quantityToAdd)
            : null,
        };
      },
      removeItem(lineId) {
        startTransition(() => {
          setItems((currentItems) =>
            currentItems.filter((item) => item.lineId !== lineId),
          );
        });
      },
      updateQuantity(lineId, quantity) {
        const nextQuantity = Number(quantity);

        if (!Number.isFinite(nextQuantity)) {
          return;
        }

        startTransition(() => {
          setItems((currentItems) =>
            currentItems
              .map((item) =>
                item.lineId === lineId
                  ? (() => {
                      const hasStockControl =
                        Number.isFinite(item.stockQuantity) && item.stockQuantity >= 0;

                      if (!hasStockControl) {
                        return {
                          ...item,
                          quantity: Math.max(1, Math.min(nextQuantity, 20)),
                        };
                      }

                      const quantityUsedBySiblingLines = currentItems
                        .filter(
                          (currentItem) =>
                            currentItem.menuItemId === item.menuItemId &&
                            currentItem.lineId !== lineId,
                        )
                        .reduce(
                          (total, currentItem) => total + currentItem.quantity,
                          0,
                        );
                      const maxAllowedForLine = Math.max(
                        0,
                        Math.min(20, item.stockQuantity - quantityUsedBySiblingLines),
                      );

                      if (maxAllowedForLine <= 0) {
                        return null;
                      }

                      return {
                        ...item,
                        quantity: Math.max(1, Math.min(nextQuantity, maxAllowedForLine)),
                      };
                    })()
                  : item,
              )
              .filter(Boolean),
          );
        });
      },
      updateNotes(lineId, notes) {
        startTransition(() => {
          setItems((currentItems) =>
            currentItems.map((item) =>
              item.lineId === lineId
                ? { ...item, notes: String(notes ?? "").trimStart() }
                : item,
            ),
          );
        });
      },
      clearCart() {
        startTransition(() => {
          setItems([]);
        });
      },
      getItemQuantity(menuItemId) {
        return items
          .filter((item) => item.menuItemId === menuItemId)
          .reduce((total, item) => total + item.quantity, 0);
      },
      getItemStockInfo(menuItemId) {
        const matchingItems = items.filter((item) => item.menuItemId === menuItemId);

        if (!matchingItems.length) {
          return {
            hasStockControl: false,
            stockQuantity: null,
            totalInCart: 0,
            remaining: null,
            lowStockThreshold: 0,
          };
        }

        const stockQuantity = Number(matchingItems[0]?.stockQuantity ?? NaN);
        const hasStockControl = Number.isFinite(stockQuantity) && stockQuantity >= 0;
        const totalInCart = matchingItems.reduce(
          (total, item) => total + item.quantity,
          0,
        );
        const lowStockThreshold = Number(
          matchingItems[0]?.lowStockThreshold ?? 0,
        );

        return {
          hasStockControl,
          stockQuantity: hasStockControl ? stockQuantity : null,
          totalInCart,
          remaining: hasStockControl ? Math.max(0, stockQuantity - totalInCart) : null,
          lowStockThreshold:
            Number.isFinite(lowStockThreshold) && lowStockThreshold >= 0
              ? lowStockThreshold
              : 0,
        };
      },
    };
  }, [isHydrated, items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
}
