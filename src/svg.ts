export function createSvgElement(
  tag: string,
  attributes?: Record<string, unknown>,
  text?: string
) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
  if (text) {
    element.innerHTML = text;
  }
  if (attributes) {
    Object.entries(attributes).forEach(([k, v]) =>
      element.setAttributeNS(null, k, v.toString())
    );
  }
  return element;
}
