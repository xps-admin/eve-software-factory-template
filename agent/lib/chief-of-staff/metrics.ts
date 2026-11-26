export interface MetricLabels {
  [key: string]: string | number | boolean;
}

export interface MetricSnapshot {
  [name: string]: number | Record<string, number>;
}

export class InMemoryMetrics {
  private readonly counters = new Map<string, number>();

  private key(name: string, labels?: MetricLabels): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }
    const suffix = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${String(v)}`)
      .join(",");
    return `${name}{${suffix}}`;
  }

  increment(name: string, value = 1, labels?: MetricLabels): void {
    const key = this.key(name, labels);
    this.counters.set(key, (this.counters.get(key) ?? 0) + value);
  }

  count(name: string, value = 1, labels?: MetricLabels): void {
    this.increment(name, value, labels);
  }

  record(name: string, value = 1, labels?: MetricLabels): void {
    this.increment(name, value, labels);
  }

  gauge(name: string, value: number, labels?: MetricLabels): void {
    this.counters.set(this.key(name, labels), value);
  }

  observe(name: string, value: number, labels?: MetricLabels): void {
    this.increment(name, value, labels);
  }

  get(name: string, labels?: MetricLabels): number {
    return this.counters.get(this.key(name, labels)) ?? 0;
  }

  snapshot(): Record<string, number> {
    return Object.fromEntries(this.counters.entries());
  }

  entries(): [string, number][] {
    return [...this.counters.entries()];
  }

  reset(): void {
    this.counters.clear();
  }

  clear(): void {
    this.reset();
  }
}

export const Metrics = InMemoryMetrics;
export type Metrics = InMemoryMetrics;
