import type { Publication } from "types/controller.types";

function shapePublicationBase(pub: any) {
  return {
    publication_id: pub.publication_id,
    title: pub.title ?? "",
    description: Array.isArray(pub.description) ? pub.description : [],
    note: Array.isArray(pub.note) ? pub.note : [],
    public: pub.public ?? false,
    published: pub.published ?? false,
    thumbnail: pub.thumbnail ?? null,
    type: pub.type
      ? {
          category_id: pub.type.category_id,
          str_value: pub.type.str_value,
          type: pub.type.type,
        }
      : null,
    style: pub.style
      ? {
          category_id: pub.style.category_id,
          str_value: pub.style.str_value,
          type: pub.style.type,
        }
      : null,
    author: pub.author
      ? {
          category_id: pub.author.category_id,
          str_value: pub.author.str_value,
          type: pub.author.type,
        }
      : null,
    tags: Array.isArray(pub.tags)
      ? pub.tags.map((t: any) => ({
          category_id: t.category?.category_id,
          str_value: t.category?.str_value,
          type: t.category?.type,
        }))
      : [],
    productsRef: Array.isArray(pub.productsRef)
      ? pub.productsRef.map((p: any) => ({
          product_id: p.product_id,
          name: p.name,
        }))
      : [],
  };
}

/* ============================================================
   Résumé (liste / cartes)
   ============================================================ */
export function shapePublicPublicationSummary(pub: any): Publication {
  const base = shapePublicationBase(pub);

  const ratings =
    Array.isArray(pub.reviews) && pub.reviews.length > 0
      ? pub.reviews.map((r: any) => r.rating ?? 0)
      : [];

  const reviewCount = ratings.length;
  const reviewAverageScore =
    reviewCount > 0
      ? ratings.reduce((a: any, b: any) => a + b, 0) / reviewCount
      : 0;

  return {
    ...base,
    contents: Array.isArray(pub.contents)
      ? pub.contents.map((c: any) => ({
          total_prep_time: c.total_prep_time ?? 0,
          servings: c.servings ?? 1,
        }))
      : [],
    reviewCount,
    reviewAverageScore,
  };
}

/* ============================================================
   Version complète (lecture par ID)
   ============================================================ */
export function shapePublicPublicationFull(pub: any): Publication {
  const base = shapePublicationBase(pub);

  const ratings =
    Array.isArray(pub.reviews) && pub.reviews.length > 0
      ? pub.reviews.map((r: any) => r.rating ?? 0)
      : [];

  const reviewCount = ratings.length;
  const reviewAverageScore =
    reviewCount > 0
      ? ratings.reduce((a: any, b: any) => a + b, 0) / reviewCount
      : 0;

  return {
    ...base,
    contents: Array.isArray(pub.contents)
      ? pub.contents.map((c: any) => ({
          content_id: c.content_id,
          total_prep_time: c.total_prep_time ?? 0,
          servings: c.servings ?? null,
          subtitle: c.subtitle ?? null,
          is_ingredient: c.is_ingredient ?? false,
          content_segments: Array.isArray(c.content_segments)
            ? c.content_segments.map((cs: any) => ({
                segment_id: cs.segment?.segment_id,
                title: cs.segment?.title ?? null,
                paragraph: cs.segment?.paragraph ?? "",
              }))
            : [],
          content_ingredients: Array.isArray(c.content_ingredients)
            ? c.content_ingredients.map((ci: any) => ({
                ingredient_id: ci.ingredient?.ingredient_id,
                quantity: ci.ingredient?.quantity ?? null,
                multiply_factor: ci.ingredient?.multiply_factor ?? 1,
                cut: ci.ingredient?.cut ?? null,
                title: ci.ingredient?.title ?? null,
                product: ci.ingredient?.product
                  ? {
                      product_id: ci.ingredient.product.product_id,
                      name: ci.ingredient.product.name,
                      macro: ci.ingredient.product.macro
                        ? {
                            calories: ci.ingredient.product.macro.calories ?? 0,
                            protein: ci.ingredient.product.macro.protein ?? 0,
                          }
                        : undefined,
                    }
                  : null,
                ingredient_units: Array.isArray(ci.ingredient?.ingredient_units)
                  ? ci.ingredient.ingredient_units.map((iu: any) => ({
                      unit_id: iu.unit?.unit_id,
                      name: iu.unit?.name,
                    }))
                  : [],
              }))
            : [],
          content_prep_times: Array.isArray(c.content_prep_times)
            ? c.content_prep_times.map((pt: any) => ({
                prep_time_id: pt.prep_time?.prep_time_id,
                duration: pt.prep_time?.duration ?? 0,
                style: pt.prep_time?.style
                  ? {
                      category_id: pt.prep_time.style.category_id,
                      str_value: pt.prep_time.style.str_value,
                    }
                  : undefined,
              }))
            : [],
        }))
      : [],
    reviewCount,
    reviewAverageScore,
  };
}