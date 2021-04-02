async function run(context) {
  // print out the version of your plugin package
  context.print.info(require("../package.json").version);
}

module.exports = {
  run,
};
