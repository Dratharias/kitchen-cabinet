// Objectifs:
// - Dédupliquer par ID
// - Supprimer les FKs redondantes au niveau parent quand l'objet enfant est présent
// - Garder une forme compacte pour l'API publique

export function deduplicateBy<T>(
  arr: T[] = [],
  keyFn: (item: T) => string,
): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of arr) {
    const key = keyFn(item);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}

function compactSegments(contentSegments: any[] = []) {
  // Input item shape (Prisma include):
  // { content_id, segment_id, position, segment: { segment_id, title, paragraph, order_num } }
  // Output:
  // { position, segment: { segment_id, title, paragraph, order_num } }
  return contentSegments.map((cs) => ({
    position: cs.position ?? null,
    segment: cs.segment
      ? {
          segment_id: cs.segment.segment_id,
          title: cs.segment.title ?? null,
          paragraph: cs.segment.paragraph,
          order_num: cs.segment.order_num ?? null,
        }
      : {
          // fallback si 'segment' n'est pas peuplé
          segment_id: cs.segment_id,
          title: null,
          paragraph: "",
          order_num: null,
        },
  }));
}

function compactIngredients(contentIngredients: any[] = []) {
  // Déjà compact dans le contrôleur, on garde une passe pour homogénéité + dédup units
  return deduplicateBy(
    contentIngredients.map((ci) => ({
      ingredient_id: ci.ingredient.ingredient_id,
      quantity: ci.ingredient.quantity ?? null,
      product: ci.ingredient.product
        ? {
            product_id: ci.ingredient.product.product_id,
            name: ci.ingredient.product.name,
            en_name: ci.ingredient.product.en_name ?? null,
            macro: ci.ingredient.product.macro ?? null,
            isRecipe: ci.ingredient.product.isRecipe ?? null,
          }
        : null,
      ingredient_units: deduplicateBy(
        (ci.ingredient.ingredient_units || []).map((iu: any) => iu.unit),
        (u: any) => u.unit_id,
      ),
    })),
    (x) => x.ingredient_id,
  );
}

function compactPrepTimes(contentPrepTimes: any[] = []) {
  // Input: { content_id, prep_time_id, prep_time: { prep_time_id, duration, style } }
  // Sortie déjà compacte dans le contrôleur, on garde l'ID du child uniquement
  return deduplicateBy(
    contentPrepTimes.map((cp) => ({
      prep_time_id: cp.prep_time.prep_time_id,
      duration: cp.prep_time.duration,
      style: cp.prep_time.style ?? null,
    })),
    (x) => x.prep_time_id,
  );
}

function compactContents(contents: any[] = []) {
  return contents.map((c) => ({
    // On enlève publication_id ici car redondant avec le parent
    content_id: c.content_id,
    total_prep_time: c.total_prep_time,
    servings: c.servings ?? null,
    content_segments: compactSegments(c.content_segments),
    content_ingredients: compactIngredients(c.content_ingredients),
    content_prep_times: compactPrepTimes(c.content_prep_times),
  }));
}

export function shapePublicPublication(pub: any) {
  return {
    ...pub,
    contents: compactContents(pub.contents || []),
  };
}
