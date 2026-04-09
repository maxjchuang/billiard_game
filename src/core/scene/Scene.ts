export interface Scene {
  enter(): void
  update(dt: number): void
  render(): void
  exit(): void
}
