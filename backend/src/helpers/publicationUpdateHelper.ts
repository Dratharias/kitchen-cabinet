import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

type AnyObj = Record<string, any>;

function ensureId(id?: string): string {
  return id ?? uuidv4();
}

function createMacroData(macro: AnyObj) {
  return {
    create: {
      macro_id: ensureId(macro.macroId),
      calories: macro.calories ?? null,
      protein: macro.protein ?? null,
      fiber: macro.fiber ?? null,
      sugar: macro.sugar ?? null,
      saturated: macro.saturated ?? null,
      trans: macro.trans ?? null,
      caffein: macro.caffein ?? null,
    },
  };
}

function createCategoriesData(categories: AnyObj[]) {
  return {
    create: categories.map((cat: AnyObj) => ({
      category: {
        connect: { category_id: cat.categoryId || cat.category_id }
      }
    }))
  };
}

function createReviewsData(reviews: AnyObj[]) {
  return {
    create: reviews.map((r: AnyObj) => ({
      review_id: ensureId(r.reviewId),
      rating: r.rating ?? null,
      comment: r.comment ?? [],
      description: r.description ?? [],
      buy_again: r.buyAgain ?? null
    }))
  };
}

function mapProductNested(product: AnyObj) {
  if (!product) return undefined;
  
  if (product.productId) {
    return { connect: { product_id: product.productId } };
  }

  const productData = {
    product_id: ensureId(product.productId),
    name: product.name,
    ...(product.en_name && { en_name: product.en_name }),
  };

  const nestedRelations: any = {};
  
  if (product.macro) {
    nestedRelations.macro = createMacroData(product.macro);
  }
  
  if (product.categories?.length) {
    nestedRelations.product_categories = createCategoriesData(product.categories);
  }
  
  if (product.reviews?.length) {
    nestedRelations.reviews = createReviewsData(product.reviews);
  }

  return {
    create: {
      ...productData,
      ...nestedRelations,
    },
  };
}

function createIngredientUnitsData(units: AnyObj[]) {
  return units.map((u: AnyObj) => ({
    unit: {
      connectOrCreate: {
        where: { name: u.name },
        create: { unit_id: uuidv4(), name: u.name },
      },
    },
  }));
}

function mapIngredientUnitsNested(units?: AnyObj[]) {
  if (!units?.length) return undefined;
  return { create: createIngredientUnitsData(units) };
}

function createPrepTimeConnection(prepTime: AnyObj) {
  if (prepTime.prepTimeId) {
    return { connect: { prep_time_id: prepTime.prepTimeId } };
  }
  
  return {
    create: {
      prep_time_id: ensureId(prepTime.prepTimeId),
      duration: prepTime.duration ?? 0,
      ...(prepTime.categoryId && { style_id: prepTime.categoryId }),
    },
  };
}

function createSegmentData(seg: AnyObj, idx: number) {
  const segmentData = {
    segment_id: ensureId(seg.segmentId),
    title: seg.title ?? null,
    paragraph: seg.paragraph,
    order_num: seg.order ?? seg.position ?? idx + 1,
  };

  if (seg.prepTimes?.length) {
    return {
      ...segmentData,
      segment_prep_time: {
        create: seg.prepTimes.map((spt: AnyObj) => ({
          prep_time: createPrepTimeConnection(spt),
        })),
      },
    };
  }

  return segmentData;
}

function createIngredientData(ing: AnyObj) {
  const ingredientBase = {
    ingredient_id: ensureId(ing.ingredientId),
    quantity: ing.quantity ?? null,
    multiply_factor: (ing.multiplyFactor ?? ing.multiply_factor) ?? 1,
  };

  const relations: any = {};
  
  if (ing.product) {
    if (ing.product.productId) {
      relations.product = { connect: { product_id: ing.product.productId } };
    } else {
      const productMapping = mapProductNested(ing.product);
      if (productMapping) relations.product = productMapping;
    }
  }
  
  if (ing.units?.length) {
    const unitsMapping = mapIngredientUnitsNested(ing.units);
    if (unitsMapping) relations.ingredient_units = unitsMapping;
  }

  return { ...ingredientBase, ...relations };
}

function createContentSegments(contentSegments: AnyObj[]) {
  return {
    create: contentSegments.map((seg: AnyObj, idx: number) => ({
      position: seg.position ?? seg.order ?? idx + 1,
      segment: { create: createSegmentData(seg, idx) },
    })),
  };
}

function createContentIngredients(contentIngredients: AnyObj[]) {
  return {
    create: contentIngredients.map((ing: AnyObj) => ({
      ingredient: { create: createIngredientData(ing) },
    })),
  };
}

function createContentPrepTimes(contentPrepTimes: AnyObj[]) {
  return {
    create: contentPrepTimes.map((pt: AnyObj) => ({
      prep_time: createPrepTimeConnection(pt),
    })),
  };
}

function buildContentCreateData(content: AnyObj) {
  const baseData = {
    content_id: content.contentId ?? uuidv4(),
    servings: content.servings ?? null,
    total_prep_time: content.totalPrepTime ?? 0,
  };

  const relations: any = {};
  
  if (content.contentPrepTimes?.length) {
    relations.content_prep_times = createContentPrepTimes(content.contentPrepTimes);
  }
  
  if (content.contentSegments?.length) {
    relations.content_segments = createContentSegments(content.contentSegments);
  }
  
  if (content.contentIngredients?.length) {
    relations.content_ingredients = createContentIngredients(content.contentIngredients);
  }

  return { ...baseData, ...relations };
}

function buildContentUpdateData(content: AnyObj) {
  const updateData: any = {};

  if (content.servings !== undefined) {
    updateData.servings = content.servings;
  }
  
  if (content.totalPrepTime !== undefined) {
    updateData.total_prep_time = content.totalPrepTime;
  }

  if (content.contentPrepTimes !== undefined) {
    updateData.content_prep_times = {
      deleteMany: {},
      ...(content.contentPrepTimes.length ? createContentPrepTimes(content.contentPrepTimes) : {}),
    };
  }

  if (content.contentSegments !== undefined) {
    updateData.content_segments = {
      deleteMany: {},
      ...(content.contentSegments.length ? createContentSegments(content.contentSegments) : {}),
    };
  }

  if (content.contentIngredients !== undefined) {
    updateData.content_ingredients = {
      deleteMany: {},
      ...(content.contentIngredients.length ? createContentIngredients(content.contentIngredients) : {}),
    };
  }

  return updateData;
}

function buildContentsUpsertData(contents: AnyObj[]) {
  return {
    upsert: contents.map((content: AnyObj) => {
      const contentId = content.contentId ?? uuidv4();
      
      return {
        where: { content_id: contentId },
        create: buildContentCreateData({ ...content, contentId }),
        update: buildContentUpdateData(content),
      };
    }),
  };
}

function buildTagsData(tags: any[]) {
  return {
    deleteMany: {},
    create: tags.map((t: any) => {
      const categoryId = typeof t === "string" 
        ? t 
        : t.categoryId || t.category_id;
      
      return { category: { connect: { category_id: categoryId } } };
    }),
  };
}

function buildCategoryConnection(categoryId: string | null | undefined) {
  if (categoryId === undefined) return {};
  
  return categoryId 
    ? { connect: { category_id: categoryId } }
    : { disconnect: true };
}

function buildIngredientsRefData(ingredientsRef: AnyObj[]) {
  return {
    deleteMany: {},
    create: ingredientsRef.map((ref: AnyObj) => {
      const baseRef = {
        ingredient_id: ensureId(ref.ingredientId),
        quantity: ref.quantity ?? null,
        multiply_factor: ref.multiply_factor ?? ref.multiplyFactor ?? 1,
      };

      const relations: any = {};
      
      if (ref.product) {
        if (ref.product.productId) {
          relations.product = { connect: { product_id: ref.product.productId } };
        } else {
          const productMapping = mapProductNested(ref.product);
          if (productMapping) relations.product = productMapping;
        }
      }
      
      if (ref.is_recipe_id) {
        relations.is_recipe_id = ref.is_recipe_id;
      }

      if (ref.units?.length) {
        const unitsMapping = mapIngredientUnitsNested(ref.units);
        if (unitsMapping) relations.ingredient_units = unitsMapping;
      }

      return { ...baseRef, ...relations };
    }),
  };
}

const defaultInclude = {
  type: true,
  style: true,
  author: true,
  tags: {
    include: { category: true }
  },
  contents: {
    include: {
      content_segments: {
        include: {
          segment: {
            include: {
              segment_prep_time: {
                include: {
                  prep_time: {
                    include: { style: true }
                  }
                }
              }
            }
          }
        },
        orderBy: { position: 'asc' as const }
      },
      content_prep_times: {
        include: {
          prep_time: {
            include: { style: true }
          }
        }
      },
      content_ingredients: {
        include: {
          ingredient: {
            include: {
              product: {
                include: {
                  macro: true,
                  product_categories: {
                    include: { category: true }
                  }
                }
              },
              ingredient_units: {
                include: { unit: true }
              }
            }
          }
        }
      }
    }
  },
  reviews: true,
  ingredientsRef: {
    include: {
      product: {
        include: {
          macro: true,
          product_categories: {
            include: { category: true }
          }
        }
      },
      ingredient_units: {
        include: { unit: true }
      }
    }
  }
} as const;

export async function updatePublicationDeep(
  prisma: PrismaClient, 
  id: string, 
  dataIn: AnyObj
) {
  const baseUpdate: AnyObj = {};

  if (dataIn.title !== undefined) baseUpdate.title = dataIn.title;
  if (dataIn.description !== undefined) baseUpdate.description = dataIn.description;
  if (dataIn.note !== undefined) baseUpdate.note = dataIn.note;
  if (dataIn.public !== undefined) baseUpdate.public = dataIn.public;
  if (dataIn.published !== undefined) baseUpdate.published = dataIn.published;
  if (dataIn.thumbnail !== undefined) baseUpdate.thumbnail = dataIn.thumbnail;

  if (dataIn.type_id !== undefined) {
    baseUpdate.type = buildCategoryConnection(dataIn.type_id);
  }
  
  if (dataIn.style_id !== undefined) {
    baseUpdate.style = buildCategoryConnection(dataIn.style_id);
  }
  
  if (dataIn.author_id !== undefined) {
    baseUpdate.author = buildCategoryConnection(dataIn.author_id);
  }

  if (dataIn.tags !== undefined) {
    baseUpdate.tags = buildTagsData(dataIn.tags);
  }

  if (Array.isArray(dataIn.contents)) {
    baseUpdate.contents = buildContentsUpsertData(dataIn.contents);
  }

  if (Array.isArray(dataIn.ingredientsRef)) {
    baseUpdate.ingredientsRef = buildIngredientsRefData(dataIn.ingredientsRef);
  }

  if (Array.isArray(dataIn.reviews)) {
    baseUpdate.reviews = {
      deleteMany: {},
      ...(dataIn.reviews.length ? createReviewsData(dataIn.reviews) : {}),
    };
  }

  return prisma.publication.update({
    where: { publication_id: id },
    data: baseUpdate,
    include: defaultInclude,
  });
}