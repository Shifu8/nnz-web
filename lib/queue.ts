/**
 * Anti-spam queue system.
 * Evita envíos masivos simultáneos aplicando:
 * - Rate limiting por usuario (IP / email)
 * - Cola con delay progresivo
 * - Personalización obligatoria
 */

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const QUEUE: Array<{ key: string; fn: () => Promise<void>; delay: number }> = [];
let processing = false;

async function processQueue() {
  if (processing) return;
  processing = true;

  while (QUEUE.length > 0) {
    const job = QUEUE.shift();
    if (!job) continue;

    await new Promise((resolve) => setTimeout(resolve, job.delay));

    try {
      await job.fn();
    } catch {
      // Individual job failures are logged by the caller
    }
  }

  processing = false;
}

export function enqueue(key: string, fn: () => Promise<void>, baseDelay = 2000) {
  QUEUE.push({ key, fn, delay: baseDelay });
  processQueue();
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetAfter: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAfter: windowMs };
  }

  if (entry.count >= limit) {
    const resetAfter = entry.resetAt - now;
    return { allowed: false, remaining: 0, resetAfter };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count, resetAfter: entry.resetAt - now };
}

export function personalizeContent(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return result;
}

export function addVariation(text: string): string {
  const greetings = ["Hola", "Hey", "Qué tal", "Saludos"];
  const emojis = ["🎟️", "🔥", "✅", "🎫", "⚡"];
  const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
  const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

  return text
    .replace(/^Hola/, randomGreeting)
    .replace(/🎟️|🔥|✅|🎫|⚡/, randomEmoji);
}

export function cleanupRateLimits() {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}

setInterval(cleanupRateLimits, 60_000);
