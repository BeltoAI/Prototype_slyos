if (!global.API_DB) {
  global.API_DB = {
    total: 0,
    perDevice: {},
    jobs: { "1": { text: "SlyOS demo text", done: false } },
    nextId: 2,
  };
}
module.exports = global.API_DB;
