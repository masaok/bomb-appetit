import { createRequire } from "node:module";
const require = createRequire("/home/keckadmin/projects/bomb-appetit/apps/web/");
const sharp = require("/home/keckadmin/projects/bomb-appetit/node_modules/.pnpm/sharp@0.35.5_@types+node@22.20.5/node_modules/sharp");
import { readdirSync } from "node:fs";
for (const f of readdirSync(".").filter((f) => f.endsWith(".svg")))
  await sharp(f).png().toFile(f.replace(".svg", ".png"));
