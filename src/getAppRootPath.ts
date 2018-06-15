import * as fs from "fs"
import * as path from "./path"
import * as process from "process"
import { AppPath } from "./applyPatches"

export function getAppRootPath(): AppPath {
  let cwd = process.cwd()
  while (!fs.existsSync(path.join(cwd, "package.json"))) {
    cwd = path.resolve(cwd, "../")
  }
  return cwd as AppPath
}
