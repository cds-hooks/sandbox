var _url = "";

module.exports = setContext;

function setContext(server) {
  setContext.url = process.env.URL || server.url
  console.log("env", process.env.URL)
  console.log("server", server.url)
}
