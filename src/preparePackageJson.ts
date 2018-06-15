import * as fsExtra from "fs-extra"
import * as path from "./path"
import * as fs from "fs"
import { resolveRelativeFileDependenciesInPackageJson } from "./resolveRelativeFileDependencies"

function deleteScripts(json: any) {
  delete json.scripts
  return json
}

export const preparePackageJson = (
  appPath: string,
  tempDirectoryPath: string,
) => {
  // reinstall a clean version of the user's node_modules in our tmp location
  fsExtra.copySync(
    path.join(appPath, "package.json"),
    path.join(tempDirectoryPath, "package.json"),
  )

  const tmpRepoPackageJsonPath = path.join(tempDirectoryPath, "package.json")

  // resolve relative file paths in package.json and delete scripts
  fs.writeFileSync(
    tmpRepoPackageJsonPath,
    JSON.stringify(
      deleteScripts(
        resolveRelativeFileDependenciesInPackageJson(
          appPath,
          require(path.join(tempDirectoryPath, "package.json")),
        ),
      ),
    ),
  )
}
