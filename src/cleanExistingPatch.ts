import * as path from "./path"
import * as fs from "fs"
import { getPatchFiles } from "./patchFs"
import { green } from "chalk"

export const cleanExistingPatch = (appPath: string, packageName: string) => {
  try {
    const patchesDir = path.join(appPath, "patches")

    if (!fs.existsSync(patchesDir)) {
      fs.mkdirSync(patchesDir)
    } else {
      // remove exsiting patch for this package, if any
      getPatchFiles(patchesDir).forEach(fileName => {
        if (
          fileName.startsWith(packageName + ":") ||
          fileName.startsWith(packageName + "+")
        ) {
          console.info(
            green("☑"),
            "Removing existing",
            path.relative(process.cwd(), path.join(patchesDir, fileName)),
          )
          fs.unlinkSync(path.join(patchesDir, fileName))
        }
      })
    }
  } catch (e) {
    console.error(e)
    throw e
  }
}
