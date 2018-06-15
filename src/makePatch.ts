import { green } from "chalk"
import * as fs from "fs"
import { join, dirname } from "./path"
import * as rimraf from "rimraf"
import { spawnSafeSync } from "./spawnSafe"
import * as fsExtra from "fs-extra"
import * as slash from "slash"

export const makePatch = (
  appPath: string,
  packageName: string,
  includePaths: RegExp,
  excludePaths: RegExp,
  tempDirectoryPath: string,
) => {
  // commit the package
  console.info(green("☑"), "Diffing your files with clean files")
  fs.writeFileSync(join(tempDirectoryPath, ".gitignore"), "!/node_modules\n\n")

  const originalNodeModulesPath = join(appPath, "node_modules")

  const originalAppPackagePath = join(originalNodeModulesPath, packageName)
  const originalPackageJsonPath = join(originalAppPackagePath, "package.json")

  const packageVersion = require(originalPackageJsonPath).version

  const tempNodeModulesPath = join(tempDirectoryPath, "node_modules")
  const tmpPackagePath = join(tempNodeModulesPath, packageName)

  const patchesDir = join(appPath, "patches")

  const tmpExec = (command: string, args?: string[]) =>
    spawnSafeSync(command, args, { cwd: tempDirectoryPath })

  tmpExec("git", ["init"])
  tmpExec("git", ["add", "-f", slash(join("node_modules", packageName))])
  tmpExec("git", ["commit", "-m", "init"])

  // replace package with user's version
  rimraf.sync(tmpPackagePath)
  fsExtra.copySync(originalAppPackagePath, tmpPackagePath, { recursive: true })

  // stage all files
  tmpExec("git", ["add", "-f", slash(join("node_modules", packageName))])

  // unstage any ignored files so they don't show up in the diff
  tmpExec("git", ["diff", "--cached", "--name-only"])
    .stdout.toString()
    .split(/\r?\n/)
    .filter(Boolean)
    .forEach((fileName: string) => {
      const scopedFileName = fileName.slice(
        `node_modules/${packageName}/`.length,
      )
      if (
        !scopedFileName.match(includePaths) ||
        scopedFileName.match(excludePaths)
      ) {
        tmpExec("git", ["reset", "HEAD", fileName])
      }
    })

  // get diff of changes
  const patch = tmpExec("git", [
    "diff",
    "--cached",
    "--no-color",
    "--ignore-space-at-eol",
    "--no-ext-diff",
  ]).stdout.toString()

  if (patch.trim() === "") {
    console.warn(`⁉️  Not creating patch file for package '${packageName}'`)
    console.warn(`⁉️  There don't appear to be any changes.`)
    process.exit(1)
  } else {
    const patchFileName = `${packageName}+${packageVersion}.patch`
    const patchPath = join(patchesDir, patchFileName)
    if (!fs.existsSync(dirname(patchPath))) {
      // scoped package
      fs.mkdirSync(dirname(patchPath))
    }
    fs.writeFileSync(patchPath, patch)
    console.log(`${green("✔")} Created file patches/${patchFileName}`)
  }
}
