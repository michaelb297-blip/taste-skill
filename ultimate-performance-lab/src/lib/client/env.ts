/** true in der serverlosen Einzeldatei-Version (ohne Konten, Datenbank und Live-Recherche). */
export const isStatic = (): boolean => typeof window !== "undefined" && !!(window as unknown as { __UPL_STATIC?: boolean }).__UPL_STATIC;
