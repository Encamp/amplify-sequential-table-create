import fs from "fs";

interface CfnResourceBody {
  Type: string;
  Properties: {
    Parameters: {
      DynamoDBModelTableReadIOPS?: any;
      [key: string]: any;
    };
  };
  DependsOn?: string[];
}

function print(message: string) {
  console.log(`Plugin sequential-table-create:`, "\t", message);
}

export async function run(context, args) {
  const apiResourceDir = `./${context.amplify._constants.AmplifyCLIDirName}/${context.amplify._constants.BackendamplifyCLISubDirName}/api`;

  // @ASSUMPTION: you only have one "api" resource in your amplify project - in general, you only have one subdirectory in the "api" directory that doesn't start with "."
  const apiDir = fs
    .readdirSync(apiResourceDir)
    .find((dirName) => !dirName.startsWith("."));
  const cfnTemplateFilepath = `${apiResourceDir}/${apiDir}/build/cloudformation-template.json`;

  let cfnTemplate = context.filesystem.read(cfnTemplateFilepath);
  if (!cfnTemplate) {
    print("Error: No built CloudFormation template found in category 'api'");
    return;
  }

  const cfnTemplateJson = JSON.parse(cfnTemplate);
  const cfnResources: { [key: string]: CfnResourceBody } =
    cfnTemplateJson.Resources;

  const dynamoModelEntries = Object.entries(cfnResources).filter(
    ([resouceName, resourceBody]) => {
      // each model has its own nested stack, so filter out any resource that isn't a nested stack
      if (resourceBody.Type !== "AWS::CloudFormation::Stack") {
        return false;
      }

      // some of the nested stacks have nothing to do with dynamo, so look for a characteristic property and remove ones that don't have it
      if (!resourceBody.Properties.Parameters?.DynamoDBModelTableReadIOPS) {
        return false;
      }

      // some of the dynamo-related nested stacks are overhead present in all Amplify projects, not this project's particular models
      if (
        [
          "ConnectionStack",
          "SearchableStack",
          "FunctionDirectiveStack",
        ].includes(resouceName)
      ) {
        return false;
      }

      return true;
    }
  );

  const dynamoModelNames = new Set<string>(
    dynamoModelEntries.map(([modelName, _resourceBody]) => modelName)
  );

  // filter out any model that already has a dependency on another model - we don't want to add even more and risk a circular dependency
  const entriesToManipulate = dynamoModelEntries.filter(
    ([_modelName, resourceBody]) =>
      !resourceBody.DependsOn.some((dependency) =>
        dynamoModelNames.has(dependency)
      )
  );

  const manipulatedEntries: [
    string,
    CfnResourceBody
  ][] = entriesToManipulate.map(
    ([modelName, resourceBody], index, wholeArray) => {
      if (!index) {
        // the first one gets to stay dependency-free
        print(
          `Model ${modelName} is the initial model with no dependencies on other models.`
        );
      } else {
        const [prevEntryModelName, _prevEntryResourceBody] = wholeArray[
          index - 1
        ];

        // actually add in the dependency on the previous model
        resourceBody.DependsOn = [
          ...(resourceBody.DependsOn || []),
          prevEntryModelName,
        ];
        print(`Model ${modelName} now depends on ${prevEntryModelName}.`);
      }
      return [modelName, resourceBody];
    }
  );

  // put the new values back into our parsed object
  for (const [modelName, resourceBody] of manipulatedEntries) {
    cfnTemplateJson.Resources[modelName] = resourceBody;
  }

  let result = cfnTemplateJson;
  if (context.parameters.options.minify === true) {
    result = JSON.stringify(result, null, 0);
  } else {
    result = JSON.stringify(result, null, 2);
  }

  context.filesystem.write(cfnTemplateFilepath, result);
}
