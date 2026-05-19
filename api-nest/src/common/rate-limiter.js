const requests = new Map();

export function rateLimit(options = { windowMs: 60000, max: 30 }) {
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const windowMs = options.windowMs;
    const max = options.max;

    let entry = requests.get(key);
    if (!entry || now - entry.start > windowMs) {
      entry = { start: now, count: 1 };
      requests.set(key, entry);
      return next();
    }

    entry.count++;
    if (entry.count > max) {
      return res.status(429).json({
        status: 'error',
        message: `Demasiadas solicitudes. Intente en ${Math.ceil((windowMs - (now - entry.start)) / 1000)}s.`,
      });
    }

    return next();
  };
}

// Limpiar entradas antiguas cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of requests) {
    if (now - entry.start > 120000) requests.delete(key);
  }
}, 300000);
