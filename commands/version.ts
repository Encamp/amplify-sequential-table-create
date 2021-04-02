export async function run(context) {
  // print out the version of your plugin package
  const { version } = await import("../package.json");
  context.print.info(version);
}
