export function getDb() {
  const g = globalThis;
  if (!g.API_DB) {
    g.API_DB = {
      total: 0,
      perDevice: {},
      jobs: { "1": { text: "SlyOS demo text", done: false } },
      nextId: 2,
    };
  }
  return g.API_DB;
}
