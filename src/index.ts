import path from "path";

export async function executeAmplifyCommand(context) {
  const commandsDirPath = path.normalize(path.join(__dirname, "commands"));
  const commandPath = path.join(commandsDirPath, context.input.command);
  const commandModule = require(commandPath);
  await commandModule.run(context);
}

export async function handleAmplifyEvent(context, args) {
  const eventHandlersDirPath = path.normalize(
    path.join(__dirname, "event-handlers")
  );
  const eventHandlerPath = path.join(
    eventHandlersDirPath,
    `handle-${args.event}`
  );
  const eventHandlerModule = require(eventHandlerPath);
  await eventHandlerModule.run(context, args);
}
