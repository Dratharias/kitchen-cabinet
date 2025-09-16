import { PrismaClient, Prisma } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

type AnyObj = Record<string, any>;

// Utility functions
const ensureId = (id?: string): string => id ?? uuidv4();

// Category mapping functions
function createCategoryConnectOrCreate(category: AnyObj): Prisma.categoryCreateNestedOneWithoutPublications_typeInput {
  if (category.categoryId) {
    return { connect: { category_id: category.categoryId } };
  }

  return {
    connectOrCreate: {
      where: { 
        str_value_type: {
          str_value: category.str_value || category.strValue,
          type: category.type
        }
      },
      create: {
        category_id: ensureId(),
        str_value: category.str_value || category.strValue,
        type: category.type,
        num_value: category.num_value || category.numValue || null,
      },
    },
  };
}

// Product mapping functions
function createMacroData(macro: AnyObj): Prisma.macroCreateNestedOneWithoutProductsInput {
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

function createProductCategories(categories: AnyObj[]): Prisma.product_categoryCreateNestedManyWithoutProductInput {
  return {
    create: categories.map((cat: AnyObj) => ({
      category: {
        connectOrCreate: {
          where: {
            str_value_type: {
              str_value: cat.str_value || cat.strValue,
              type: cat.type
            }
          },
          create: {
            category_id: ensureId(),
            str_value: cat.str_value || cat.strValue,
            type: cat.type,
            num_value: cat.num_value || cat.numValue || null,
          }
        }
      },
    })),
  };
}

function createProductReviews(reviews: AnyObj[]): Prisma.reviewCreateNestedManyWithoutProductInput {
  return {
    create: reviews.map((review: AnyObj) => ({
      review_id: ensureId(review.reviewId),
      rating: review.rating ?? null,
      comment: review.comment ?? [],
      description: review.description ?? [],
      buy_again: review.buyAgain ?? null,
    })),
  };
}

function mapProductNested(product: AnyObj): Prisma.productCreateNestedOneWithoutIngredientsInput | undefined {
  if (!product) return undefined;
  
  if (product.productId) {
    return { connect: { product_id: product.productId } };
  }

  const productData: Prisma.productCreateWithoutIngredientsInput = {
    product_id: ensureId(product.productId),
    name: product.name,
  };

  if (product.en_name) productData.en_name = product.en_name;
  if (product.macro) productData.macro = createMacroData(product.macro);
  if (product.categories?.length) productData.product_categories = createProductCategories(product.categories);
  if (product.reviews?.length) productData.reviews = createProductReviews(product.reviews);

  return { create: productData };
}

// Ingredient and unit mapping functions
function mapIngredientUnitsNested(units: AnyObj[]): Prisma.ingredient_unitCreateNestedManyWithoutIngredientInput {
  return {
    create: units.map((unit: AnyObj) => ({
      unit: {
        connectOrCreate: {
          where: { name: unit.name },
          create: { unit_id: uuidv4(), name: unit.name },
        },
      },
    })),
  };
}

// Prep time functions
function createPrepTime(prepTimeData: AnyObj): Prisma.prep_timeCreateNestedOneWithoutContent_prep_timesInput | Prisma.prep_timeCreateNestedOneWithoutSegment_prep_timeInput {
  if (prepTimeData.prepTimeId) {
    return { connect: { prep_time_id: prepTimeData.prepTimeId } };
  }

  const createData: Prisma.prep_timeCreateWithoutContent_prep_timesInput = {
    prep_time_id: ensureId(prepTimeData.prepTimeId),
    duration: prepTimeData.duration ?? 0,
  };

  if (prepTimeData.categoryId) {
    createData.style = { connect: { category_id: prepTimeData.categoryId } };
  } else if (prepTimeData.style) {
    createData.style = createCategoryConnectOrCreate(prepTimeData.style);
  }

  return { create: createData };
}

function createContentPrepTimes(prepTimes: AnyObj[]): Prisma.content_prep_timeCreateNestedManyWithoutContentInput {
  return {
    create: prepTimes.map((prepTime: AnyObj) => ({
      prep_time: createPrepTime(prepTime) as Prisma.prep_timeCreateNestedOneWithoutContent_prep_timesInput,
    })),
  };
}

function createSegmentPrepTimes(prepTimes: AnyObj[]): Prisma.segment_prep_timeCreateNestedManyWithoutSegmentInput {
  return {
    create: prepTimes.map((prepTime: AnyObj) => ({
      prep_time: createPrepTime(prepTime) as Prisma.prep_timeCreateNestedOneWithoutSegment_prep_timeInput,
    })),
  };
}

// Segment functions
function createContentSegments(segments: AnyObj[]): Prisma.content_segmentCreateNestedManyWithoutContentInput {
  return {
    create: segments.map((segment: AnyObj, index: number) => {
      const segmentData: Prisma.segmentCreateWithoutContent_segmentsInput = {
        segment_id: ensureId(segment.segmentId),
        title: segment.title ?? null,
        paragraph: segment.paragraph,
        order_num: segment.order ?? segment.position ?? index + 1,
      };

      if (segment.prepTimes?.length) {
        segmentData.segment_prep_time = createSegmentPrepTimes(segment.prepTimes);
      }

      return {
        position: segment.position ?? segment.order ?? index + 1,
        segment: {
          connectOrCreate: {
            where: { paragraph: segment.paragraph },
            create: segmentData
          }
        },
      };
    }),
  };
}

// Ingredient functions
function createContentIngredients(ingredients: AnyObj[]): Prisma.content_ingredientCreateNestedManyWithoutContentInput {
  return {
    create: ingredients.map((ingredient: AnyObj) => {
      const ingredientData: Prisma.ingredientCreateWithoutContent_ingredientsInput = {
          ingredient_id: ensureId(ingredient.ingredientId),
          quantity: ingredient.quantity ?? null,
          multiply_factor: ingredient.multiplyFactor ?? ingredient.multiply_factor ?? 1,
          product: {
              create: undefined,
              connectOrCreate: undefined,
              connect: undefined
          }
      };

      if (ingredient.product) {
        const productMapping = mapProductNested(ingredient.product);
        if (productMapping) ingredientData.product = productMapping;
      }

      if (ingredient.units?.length) {
        ingredientData.ingredient_units = mapIngredientUnitsNested(ingredient.units);
      }

      return { ingredient: { create: ingredientData } };
    }),
  };
}

// Content functions
function createPublicationContents(contents: AnyObj[]): Prisma.contentCreateNestedManyWithoutPublicationInput {
  return {
    create: contents.map((content: AnyObj) => {
      const contentData: Prisma.contentCreateWithoutPublicationInput = {
        content_id: ensureId(content.contentId),
        servings: content.servings ?? null,
        total_prep_time: content.totalPrepTime ?? 0,
      };

      if (content.contentPrepTimes?.length) {
        contentData.content_prep_times = createContentPrepTimes(content.contentPrepTimes);
      }

      if (content.contentSegments?.length) {
        contentData.content_segments = createContentSegments(content.contentSegments);
      }

      if (content.contentIngredients?.length) {
        contentData.content_ingredients = createContentIngredients(content.contentIngredients);
      }

      return contentData;
    }),
  };
}

// Tag functions
function createPublicationTags(tags: AnyObj[]): Prisma.publication_tagCreateNestedManyWithoutPublicationInput {
  return {
    create: tags.map((tag: any) => {
      if (typeof tag === "string") {
        return { category: { connect: { category_id: tag } } };
      }
      
      if (tag.categoryId) {
        return { category: { connect: { category_id: tag.categoryId } } };
      }

      return { 
        category: {
          connectOrCreate: {
            where: {
              str_value_type: {
                str_value: tag.str_value || tag.strValue,
                type: tag.type
              }
            },
            create: {
              category_id: ensureId(),
              str_value: tag.str_value || tag.strValue,
              type: tag.type,
              num_value: tag.num_value || tag.numValue || null,
            }
          }
        }
      };
    }),
  };
}

// Ingredient reference functions
function createIngredientReferences(ingredientsRef: AnyObj[]): Prisma.ingredientCreateNestedManyWithoutIsRecipeInput {
  return {
    create: ingredientsRef.map((ref: AnyObj) => {
      const refData: Prisma.ingredientCreateWithoutIsRecipeInput = {
          ingredient_id: ensureId(ref.ingredientId),
          quantity: ref.quantity ?? null,
          multiply_factor: ref.multiply_factor ?? ref.multiplyFactor ?? 1,
          product: {
              create: undefined,
              connectOrCreate: undefined,
              connect: undefined
          }
      };

      if (ref.product) {
        const productMapping = mapProductNested(ref.product);
        if (productMapping) refData.product = productMapping;
      }

      if (ref.units?.length) {
        refData.ingredient_units = mapIngredientUnitsNested(ref.units);
      }

      return refData;
    }),
  };
}

// Review functions
function createPublicationReviews(reviews: AnyObj[]): Prisma.reviewCreateNestedManyWithoutPublicationInput {
  return {
    create: reviews.map((review: AnyObj) => ({
      review_id: ensureId(review.reviewId),
      rating: review.rating ?? null,
      comment: review.comment ?? [],
      description: review.description ?? [],
      buy_again: review.buyAgain ?? null,
    })),
  };
}

// Main publication data builder
function buildPublicationData(body: AnyObj): Prisma.publicationCreateInput {
  const data: Prisma.publicationCreateInput = {
    publication_id: ensureId(body.publicationId),
    title: body.title,
    description: body.description ?? [],
    note: body.note ?? [],
    public: body.public ?? false,
    published: body.published ?? false,
  };

  if (body.thumbnail) data.thumbnail = body.thumbnail;
  if (body.type_id) data.type = { connect: { category_id: body.type_id } };
  if (body.style_id) data.style = { connect: { category_id: body.style_id } };
  if (body.author_id) data.author = { connect: { category_id: body.author_id } };
  if (body.tags?.length) data.tags = createPublicationTags(body.tags);
  if (body.contents?.length) data.contents = createPublicationContents(body.contents);
  if (body.ingredientsRef?.length) data.ingredientsRef = createIngredientReferences(body.ingredientsRef);
  if (body.reviews?.length) data.reviews = createPublicationReviews(body.reviews);

  return data;
}

// Default include configuration
const defaultInclude = {
  type: true,
  style: true,
  author: true,
  tags: {
    include: {
      category: true,
    },
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
                    include: {
                      category: true,
                    },
                  },
                },
              }, 
              ingredient_units: { 
                include: { unit: true } 
              } 
            } 
          } 
        } 
      },
    },
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

// Main export function
export async function createPublicationDeep(prisma: PrismaClient, body: AnyObj) {
  const data = buildPublicationData(body);
  return prisma.publication.create({ data, include: defaultInclude });
}

// Export function with duplicate checking
export async function createPublicationDeepWithDuplicateCheck(prisma: PrismaClient, body: AnyObj) {
  const { DuplicateCheckHelper } = await import('./duplicateCheckHelper');
  const duplicateChecker = new DuplicateCheckHelper(prisma);
  const processedBody = await duplicateChecker.preprocessPublicationData(body);
  const data = buildPublicationData(processedBody);
  return prisma.publication.create({ data, include: defaultInclude });
}