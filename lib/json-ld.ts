/**
 * Serialises structured data for embedding in a <script> tag.
 *
 * JSON.stringify does not escape `<`, so a value containing `</script>` closes
 * the tag early and everything after it is parsed as HTML. Event names reach
 * this from the public submit form and from pull requests, so the value is
 * attacker-influenced. Escaping the three characters that can start a tag or a
 * comment keeps the payload valid JSON while making it inert inside HTML.
 */
export function toJsonLdScript(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}
