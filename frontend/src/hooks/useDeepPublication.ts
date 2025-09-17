import { createResource } from "solid-js";
import { api } from "../lib/apiClient";
import type {
  Publication,
  Content,
  Segment,
  PrepTime,
  Ingredient,
  Product,
  Macro,
  Category,
  Unit,
} from "../types";

// Récupère une publication et toutes ses relations en profondeur
export function useDeepPublication(id: () => string) {
  const [data] = createResource(id, async (id) => {
    // publication de base avec include côté back
    const pub = await api.get<Publication>(`/api/publications/${id}`);

    // enrichir contents
    const contents: Content[] = await Promise.all(
      (pub.contents ?? []).map(async (c) => {
        const fullContent = await api.get<Content>(`/api/contents/${c.content_id}`);

        // enrichir segments avec leurs prepTimes
        const segments: Segment[] = await Promise.all(
          (fullContent.connect?.content_segments ?? []).map(async (s) => {
            const seg = await api.get<Segment>(`/api/segments/${s.segment_id}`);
            const prepTimes: PrepTime[] = await Promise.all(
              (seg.connect?.segment_prep_time ?? []).map((p) =>
                api.get<PrepTime>(`/api/prepTimes/${p.prep_time_id}`)
              )
            );
            return { ...seg, prepTimes };
          })
        );

        // enrichir ingredients avec leurs produits
        const ingredients: Ingredient[] = await Promise.all(
          (fullContent.connect?.content_ingredients ?? []).map(async (i) => {
            const ing = await api.get<Ingredient>(`/api/ingredients/${i.ingredient_id}`);
            let product: Product | undefined;
            let macro: Macro | undefined;
            let categories: Category[] = [];
            let units: Unit[] = [];

            if (ing.product_id) {
              product = await api.get<Product>(`/api/products/${ing.product_id}`);
              if (product.macro_id) {
                macro = await api.get<Macro>(`/api/macros/${product.macro_id}`);
              }
              if (product.connect?.product_categories) {
                categories = await Promise.all(
                  product.connect.product_categories.map((cat) =>
                    api.get<Category>(`/api/categories/${cat.category_id}`)
                  )
                );
              }
            }

            if (ing.connect?.ingredient_units) {
              units = await Promise.all(
                ing.connect.ingredient_units.map((u) =>
                  api.get<Unit>(`/api/units/${u.unit_id}`)
                )
              );
            }

            return { ...ing, product, macro, categories, units };
          })
        );

        return { ...fullContent, segments, ingredients };
      })
    );

    // enrichir tags
    const tags: Category[] = await Promise.all(
      (pub.tags ?? []).map((t) => api.get<Category>(`/api/categories/${t.category_id}`))
    );

    // enrichir ingredientsRef directement reliés à la publication
    const ingredientsRef: Ingredient[] = await Promise.all(
      (pub.ingredientsRef ?? []).map((i) =>
        api.get<Ingredient>(`/api/ingredients/${i.ingredient_id}`)
      )
    );

    return { ...pub, contents, tags, ingredientsRef };
  });

  return { data };
}
