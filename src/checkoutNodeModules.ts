import * as fsExtra from "fs-extra"
import { resolveRelativeFileDependenciesInPackageLock } from "./resolveRelativeFileDependencies"
import { PackageManager } from "./detectPackageManager"
import * as path from "./path"
import { spawnSafeSync } from "./spawnSafe"
import * as fs from "fs"
import { green } from "chalk"

// function printNoPackageFoundError(
//   packageName: string,
//   packageJsonPath: string,
// ) {
//   console.error(
//     `No such package ${packageName}
//
//   File not found: ${packageJsonPath}`,
//   )
// }

export const checkoutNodeModules = (
  appPath: string,
  tempDirectoryPath: string,
  packageManager: PackageManager,
) => {
  // if (!fs.existsSync(packageJsonPath)) {
  //   printNoPackageFoundError(packageName, packageJsonPath);
  //   process.exit(1);
  // }
  try {
    const tmpExec = (command: string, args?: string[]) =>
      spawnSafeSync(command, args, { cwd: tempDirectoryPath })

    if (packageManager === "yarn") {
      fsExtra.copySync(
        path.join(appPath, "yarn.lock"),
        path.join(tempDirectoryPath, "yarn.lock"),
      )
      console.info(green("☑"), "Building clean node_modules with yarn")
      tmpExec(`yarn`)
    } else {
      const lockFileName =
        packageManager === "npm-shrinkwrap"
          ? "npm-shrinkwrap.json"
          : "package-lock.json"

      const lockFileContents = JSON.parse(
        fsExtra.readFileSync(path.join(appPath, lockFileName)).toString(),
      )
      const resolvedLockFileContents = resolveRelativeFileDependenciesInPackageLock(
        appPath,
        lockFileContents,
      )
      fs.writeFileSync(
        path.join(tempDirectoryPath, lockFileName),
        JSON.stringify(resolvedLockFileContents),
      )
      console.info(green("☑"), "Building clean node_modules with npm")
      tmpExec("npm", ["i"])
    }
  } catch (e) {
    console.error(e)
    throw e
  }
}
