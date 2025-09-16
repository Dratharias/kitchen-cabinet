import {
  PublicationDetails,
  ContentDetails,
  SegmentDetails,
  IngredientDetails,
  IngredientProduct,
  PublicationReview
} from "../types/publication";

export interface DeepPayload {
  title: string;
  description?: string[];
  note?: string[];
  public?: boolean;
  published?: boolean;
  thumbnail?: string;
  type_id?: string;
  style_id?: string;
  author_id?: string;
  contents?: any[];
  reviews?: any[];
  ingredientsRef?: any[];
}

// Transforme un produit et son nested complet
const mapProductToPayload = (product: IngredientProduct & { macro?: any, categories?: any[], reviews?: PublicationReview[] }) => ({
  product_id: product.productId,
  name: product.name,
  macro: product.macro ? {
    calories: product.macro.calories,
    protein: product.macro.protein,
    fiber: product.macro.fiber,
    sugar: product.macro.sugar,
    saturated: product.macro.saturated,
    trans: product.macro.trans,
    caffein: product.macro.caffein
  } : undefined,
  product_categories: product.categories?.map(cat => ({
    category_id: cat.categoryId,
    str_value: cat.strValue,
    type: cat.type
  })),
  reviews: product.reviews?.map(r => ({
    rating: r.rating,
    comment: r.comment || [],
    description: r.description || [],
    buy_again: r.buyAgain
  }))
});

// Transforme un ingredient et son produit nested
const mapIngredientToPayload = (ingredient: IngredientDetails) => ({
  ingredient_id: ingredient.ingredientId,
  quantity: ingredient.quantity,
  multiply_factor: ingredient.multiplyFactor,
  product: mapProductToPayload(ingredient.product),
  ingredient_units: ingredient.units?.map(u => ({ unit: { name: u.name } })) || []
});

// Transforme un segment avec ses prepTimes
const mapSegmentToPayload = (segment: SegmentDetails) => ({
  segment: {
    title: segment.title,
    paragraph: segment.paragraph,
    order_num: segment.order,
    segment_prep_time: segment.prepTimes.map(pt => ({
      prep_time: {
        duration: pt.duration,
        style: pt.category ? {
          category_id: pt.category.categoryId,
          str_value: pt.category.strValue,
          type: pt.category.type
        } : undefined
      }
    }))
  },
  position: segment.order
});

// Transforme un content complet
const mapContentToPayload = (content: ContentDetails) => ({
  total_prep_time: content.totalPrepTime,
  servings: content.servings,
  content_segments: content.segments.map(mapSegmentToPayload),
  content_ingredients: content.ingredients.map(mapIngredientToPayload),
  content_prep_times: content.prepTimes.map(pt => ({
    prep_time: {
      duration: pt.duration,
      style: pt.category ? {
        category_id: pt.category.categoryId,
        str_value: pt.category.strValue,
        type: pt.category.type
      } : undefined
    }
  }))
});

// Transforme les reviews de la publication
const mapReviewsToPayload = (reviews: PublicationReview[]) => reviews.map(r => ({
  rating: r.rating,
  comment: r.comment || [],
  description: r.description || [],
  buy_again: r.buyAgain
}));

// Fonction principale pour créer le payload totalement nested
export const createDeepPayload = (pub: PublicationDetails): DeepPayload => ({
  title: pub.title,
  description: pub.description,
  note: pub.note,
  public: pub.public,
  published: pub.published,
  thumbnail: pub.thumbnail,
  type_id: pub.type?.categoryId,
  style_id: pub.style?.categoryId,
  author_id: pub.author?.categoryId,
  contents: pub.contents?.map(mapContentToPayload),
  reviews: pub.reviewsCount ? mapReviewsToPayload(pub.reviews as PublicationReview[]) : [],
  ingredientsRef: pub.contents?.flatMap(c =>
    c.ingredients
      .filter(i => i.product)
      .map(i => ({
        quantity: i.quantity,
        multiply_factor: i.multiplyFactor,
        product: mapProductToPayload(i.product)
      }))
  )
});
