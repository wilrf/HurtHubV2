/**
 * Performance utilities to reduce main thread blocking
 */

/**
 * Chunk large operations to prevent blocking the main thread
 */
export function processInChunks<T>(
  items: T[],
  processor: (item: T, index: number) => void,
  chunkSize: number = 50,
): Promise<void> {
  return new Promise((resolve) => {
    let currentIndex = 0;

    const processChunk = () => {
      const endIndex = Math.min(currentIndex + chunkSize, items.length);

      for (let i = currentIndex; i < endIndex; i++) {
        processor(items[i], i);
      }

      currentIndex = endIndex;

      if (currentIndex < items.length) {
        // Yield control back to the browser
        setTimeout(processChunk, 0);
      } else {
        resolve();
      }
    };

    processChunk();
  });
}

/**
 * Schedule work during idle time
 */
export function scheduleIdleWork(callback: () => void | Promise<void>): void {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(
      () => {
        callback();
      },
      { timeout: 5000 },
    );
  } else {
    setTimeout(callback, 0);
  }
}

/**
 * Debounce function to limit rapid calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle function to limit call frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Performance monitor for development
 */
export class PerformanceMonitor {
  private static timers = new Map<string, number>();

  static start(label: string): void {
    if (process.env.NODE_ENV === "development") {
      this.timers.set(label, performance.now());
    }
  }

  static end(label: string): number {
    if (process.env.NODE_ENV === "development") {
      const startTime = this.timers.get(label);
      if (startTime) {
        const duration = performance.now() - startTime;
        console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
        this.timers.delete(label);

        // Warn about slow operations
        if (duration > 100) {
          console.warn(
            `🐌 Slow operation detected: ${label} took ${duration.toFixed(2)}ms`,
          );
        }

        return duration;
      }
    }
    return 0;
  }

  static measureAsync<T>(
    label: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    this.start(label);
    return operation().finally(() => {
      this.end(label);
    });
  }
}
