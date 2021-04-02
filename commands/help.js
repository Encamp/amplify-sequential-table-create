async function run(context) {
  // print out the help message of your plugin
  context.print.info(`
Usage:

amplify sequential-table-create [command]

Commands:
- help: print this message and exit
- version: print version and exit

Otherwise, this is a plugin that automatically runs when certain events from the Amplify CLI occur; see https://docs.amplify.aws/cli/plugins#official-plugins and learn more about this one in particular from the GitHub repo, https://github.com/Encamp/amplify-slow-table-create
  `);
}

module.exports = {
  run,
};
