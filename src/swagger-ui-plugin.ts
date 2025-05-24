import { OpenApiPlugin } from "@sigiljs-community/openapi-plugin"
import { SigilPlugin } from "@sigiljs/sigil"
import path from "node:path"
import generateHtml, { SwaggerGenOptions } from "./gen/generateHtml"

export type SwaggerUiPluginConfig = Omit<SwaggerGenOptions, "swaggerInitOptions"> & { swaggerInitOptions: Record<string, any> } & {
  path?: string
}

export default class SwaggerUiPlugin extends SigilPlugin<SwaggerUiPluginConfig> {
  public static name = "SwaggerUiPlugin"

  readonly #path: string
  readonly #uiModule?: any
  #html = ""

  constructor() {
    super()

    this.#uiModule = require("swagger-ui-dist")

    this.#path = (this.$pluginConfig.path ?? "/docs/").trim()
    if (!this.#path.endsWith("/")) this.#path += "/"
  }

  public onInitialize(): any {
    if (!this.#uiModule) return

    const uiPath = this.#uiModule.absolutePath()

    this.sigil.addMiddleware(async (req, res, mod) => {
      if (!req.path.startsWith(this.#path.slice(0, -1))) return

      if ([".js", ".css"].some(ext => req.path.endsWith(ext))) {
        const file = res.fileResponse(path.join(uiPath, req.path.slice(this.#path.length)))
        if (mod.headers) Object.entries(mod.headers).forEach(([key, value]) => {
          file.headers.set(key, value)
        })

        return file
      }

      return res.rawResponse(this.#html, { ...mod.headers || {}, "content-type": "text/html" })
    })
  }

  public async onUpdateCallback() {
    const openApiPlugin = this.sigil.plugin(OpenApiPlugin)

    const { path, ...rest } = this.$pluginConfig
    this.#html = await generateHtml({
      ...rest,
      base: this.#path,
      swaggerInitOptions: {
        ...rest.swaggerInitOptions,
        swaggerDoc: openApiPlugin.openApiDefinition
      }
    })
  }
}