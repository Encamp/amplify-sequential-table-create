const eventName = "PrePush";

export async function run(context, args) {
  console.log(context);

  let cftloc = "./amplify/backend/api/ash/build/cloudformation-template.json";
  console.log(cftloc);

  let cft = context.filesystem.read(cftloc);
  if (!cft) {
    console.log("ERROR! NO Cloudformation Template found.");
    return;
  }

  let cftJson = JSON.parse(cft);
  let cftResources = cftJson.Resources;
  let item = "";
  let dependOnName = "";

  for (item in cftResources) {
    if (
      cftResources.hasOwnProperty(item) &&
      item != "ConnectionStack" &&
      item != "SearchableStack" &&
      cftResources[item].Properties &&
      cftResources[item].Properties.Parameters &&
      cftResources[item].Properties.Parameters.DynamoDBModelTableReadIOPS
    ) {
      if (dependOnName != "") {
        // @ts-ignore
        let dependsOn = Object.values(cftResources[item].DependsOn);
        dependsOn.push(dependOnName);
        cftJson.Resources[item].DependsOn = dependsOn;
        console.log(
          "Adding " + dependOnName + " to " + item + ".DependsOn..........."
        );
      } else {
        console.log("Skipping first table - " + item + "..............");
      }
      dependOnName = item;
    }
  }

  let result = cftJson;
  if (context.parameters.options.minify === true) {
    result = JSON.stringify(result, null, 0);
  } else {
    result = JSON.stringify(result, null, 2);
  }
  // console.log(result);

  context.filesystem.write(cftloc, result);
}
