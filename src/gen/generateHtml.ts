import { jsonStringify } from "@sigiljs/sigil/utils"
import { swaggerHtmlTemplate } from "./swaggerHtmlTemplate"

function replace(template: string, key: string, value: string): string {
  const pattern = new RegExp(`<%\\s*${key}\\s*%>`, "g")
  return template.replace(pattern, value)
}

export interface SwaggerGenOptions {
  htmlMeta?: Record<string, string>
  favIcon?: (string | { type?: string, url: string, size?: number }) | (string | { type?: string, url: string, size?: number })[]
  title?: string
  swaggerInitOptions?: {
    swaggerDoc: Record<any, any>
  } & Record<string, any>
  customJs?: string
  customCss?: string
  base: string
  swaggerStylesheet?: string
  allowExplorer?: boolean
}

export default async function generateHtml(options: SwaggerGenOptions) {
  let customCssUrl: string = ""
  let customCssCode: string = ""
  let customJsUrl: string = ""
  let customJsCode: string = ""

  if (options.customCss) {
    if (options.customCss.startsWith("http")) customCssUrl = `<link rel="stylesheet" href="${ options.customCss }" />`
    else customCssCode = `<style>${ options.customCss }</style>`
  }

  if (options.customJs) {
    if (options.customJs.startsWith("http")) customJsUrl = `<script src="${ options.customJs }"></script>`
    else customJsCode = `<script>${ options.customJs }</script>`
  }

  let htmlFile = swaggerHtmlTemplate

  htmlFile = replace(htmlFile, "robotsMetaString", Object.entries(options.htmlMeta ?? {}).map(([k, v]) => (
    `<meta content="${ v }" property="${ k }" />`
  )).join("\n"))

  htmlFile = replace(htmlFile, "title", options.title || "Swagger Documentation")

  let favIconString = ""
  if (options.favIcon) {
    const _icons = Array.isArray(options.favIcon) ? options.favIcon : [options.favIcon]
    const _list = _icons.map(i => {
      const url = typeof i === "string" ? i : i.url
      const mime = url.includes(".") ? url.split(".").slice(-1)[0] : "x-icon"

      if (typeof i === "string") {
        return `<link rel="icon" type="image/${ mime }" href="${ i }" />`
      }

      if (i.size) return `<link rel="icon" type="${ i.type || mime }" href="${ i }" sizes="${ i.size }x${ i.size }" />`
      return `<link rel="icon" type="${ i.type || mime }" href="${ i }" />`
    })

    favIconString = _list.join("\n")
  }

  htmlFile = replace(htmlFile, "favIconString", favIconString)

  htmlFile = htmlFile.replace(`"<% swaggerInitOptions %>"`, jsonStringify(options.swaggerInitOptions || {}, { fallback: "{}" }))

  htmlFile = replace(htmlFile, "customJs", customJsUrl)
  htmlFile = replace(htmlFile, "customJsString", customJsCode)

  const explorerString = options.allowExplorer === true ? "" : ".swagger-ui .topbar .download-url-wrapper { display: none }"

  htmlFile = replace(htmlFile, "customCss", customCssUrl)
  htmlFile = replace(htmlFile, "customCssString", `<style>${ explorerString }</style>` + customCssCode)

  htmlFile = replace(htmlFile, "basePath", options.base)
  htmlFile = replace(htmlFile, "coreStylesUrl", options.swaggerStylesheet || "https://unpkg.com/swagger-ui-dist@5/swagger-ui.css")

  return htmlFile
}