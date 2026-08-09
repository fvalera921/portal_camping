export type Sesion = {
  autorizado: true;
};

/**
 * Stub de sesión: en fase 1 no hay autenticación, así que siempre autoriza.
 * Las rutas mutantes de app/api/**\/route.ts llaman a esto para que, cuando se
 * añada autenticación real, baste con sustituir esta función sin tocar cada ruta.
 */
export async function getSession(): Promise<Sesion> {
  return { autorizado: true };
}
