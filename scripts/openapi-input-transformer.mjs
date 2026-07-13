/**
 * Orval input transformer — sanitizes known SaleNet spec defects before
 * validation so `pnpm gen:api` works against both the live URL and the
 * committed snapshot:
 *
 * - Empty `enum: []` arrays (e.g. ProductDetailResDto.manufactureYear) are
 *   invalid OpenAPI; drop the property so the field falls back to its base
 *   type. Report upstream: the NestJS decorator likely receives an empty list.
 */
export default function transformer(spec) {
  const visit = (node) => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (node && typeof node === 'object') {
      if (Array.isArray(node.enum) && node.enum.length === 0) {
        delete node.enum;
      }
      Object.values(node).forEach(visit);
    }
  };
  visit(spec);
  return spec;
}
