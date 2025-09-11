/**
 * Prisma Mass Seed Script
 * -----------------------
 * Generates ~100 publications across types:
 * - Book (~15%)
 * - Recipe (~40%)
 * - Article (~25%)
 * - Review (~20%)
 *
 * Rules:
 * - Reviews attach to either a product OR a publication (but not both).
 * - Books have multiple chapters (contents).
 * - Recipes include ingredients, units, prep_times.
 * - Articles are segment-heavy, text-focused.
 * - Users: exactly one admin.
 * - Categories are idempotent (no duplicates).
 */

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ---------------------------
// Helpers
// ---------------------------
async function ensureCategory(str_value, type) {
  const found = await prisma.category.findFirst({ where: { str_value, type } });
  if (found) return found;
  return await prisma.category.create({
    data: { category_id: uuidv4(), str_value, type },
  });
}

async function ensureUser(username, password, role = 'user') {
  const found = await prisma.app_user.findUnique({ where: { username } });
  if (found) return found;

  const hashed = await bcrypt.hash(password, 10);

  return await prisma.app_user.create({
    data: {
      user_id: uuidv4(),
      username,
      password: hashed,
      role,
    },
  });
}

async function createProduct() {
  const macroId = uuidv4();
  await prisma.macro.create({
    data: {
      macro_id: macroId,
      calories: faker.number.int({ min: 50, max: 800 }),
      protein: faker.number.int({ min: 0, max: 100 }),
      fiber: faker.number.int({ min: 0, max: 50 }),
      sugar: faker.number.int({ min: 0, max: 50 }),
      saturated: faker.number.int({ min: 0, max: 50 }),
      trans: faker.number.int({ min: 0, max: 10 }),
      caffein: faker.number.int({ min: 0, max: 100 }),
    },
  });

  const productId = uuidv4();
  return await prisma.product.create({
    data: {
      product_id: productId,
      name: faker.commerce.productName(),
      en_name: faker.commerce.product(),
      macro_id: macroId,
    },
  });
}

async function createIngredient(product) {
  const unit = await prisma.unit.upsert({
    where: { name: 'grams' },
    update: {},
    create: { unit_id: uuidv4(), name: 'grams' },
  });

  const ingredientId = uuidv4();
  const ingredient = await prisma.ingredient.create({
    data: {
      ingredient_id: ingredientId,
      quantity: faker.number.int({ min: 1, max: 500 }),
      product_id: product.product_id,
    },
  });

  await prisma.ingredient_unit.create({
    data: { ingredient_id: ingredientId, unit_id: unit.unit_id },
  });

  return ingredient;
}

// ---------------------------
// Publication Archetypes
// ---------------------------
async function createBook(style, author) {
  const publicationId = uuidv4();
  const bookType = await prisma.category.findFirst({
    where: { str_value: 'Book', type: 'Type' },
  });

  await prisma.publication.create({
    data: {
      publication_id: publicationId,
      title: faker.lorem.words({ min: 2, max: 5 }),
      description: [faker.lorem.paragraph()],
      note: [faker.lorem.sentence()],
      public: true,
      published: true,
      type_id: bookType.category_id,
      style_id: style.category_id,
      author_id: author.category_id,
    },
  });

  const numChapters = faker.number.int({ min: 3, max: 8 });
  for (let i = 1; i <= numChapters; i++) {
    const contentId = uuidv4();
    await prisma.content.create({
      data: {
        content_id: contentId,
        publication_id: publicationId,
        servings: null,
        total_prep_time: 0,
      },
    });

    const numSegments = faker.number.int({ min: 2, max: 6 });
    for (let s = 1; s <= numSegments; s++) {
      const segId = uuidv4();
      await prisma.segment.create({
        data: {
          segment_id: segId,
          title: `Chapter ${i} - Section ${s}`,
          paragraph: faker.lorem.paragraph(),
          order_num: s,
        },
      });
      await prisma.content_segment.create({
        data: { content_id: contentId, segment_id: segId, position: s },
      });
    }
  }
}

async function createRecipe(style, author, product) {
  const publicationId = uuidv4();
  const recipeType = await prisma.category.findFirst({
    where: { str_value: 'Recipe', type: 'Type' },
  });

  await prisma.publication.create({
    data: {
      publication_id: publicationId,
      title: faker.commerce.productName() + ' Recipe',
      description: [faker.lorem.paragraph()],
      note: [faker.lorem.sentence()],
      public: true,
      published: true,
      type_id: recipeType.category_id,
      style_id: style.category_id,
      author_id: author.category_id,
    },
  });

  const contentId = uuidv4();
  const totalPrep = faker.number.int({ min: 10, max: 90 });
  await prisma.content.create({
    data: {
      content_id: contentId,
      publication_id: publicationId,
      servings: faker.number.int({ min: 1, max: 8 }),
      total_prep_time: totalPrep,
    },
  });

  // PrepTime
  const prepId = uuidv4();
  await prisma.prep_time.create({
    data: { prep_time_id: prepId, duration: totalPrep },
  });
  await prisma.content_prep_time.create({
    data: { content_id: contentId, prep_time_id: prepId },
  });

  // Ingredients
  const numIngredients = faker.number.int({ min: 2, max: 6 });
  for (let i = 0; i < numIngredients; i++) {
    const ingredient = await createIngredient(product);
    await prisma.content_ingredient.create({
      data: { content_id: contentId, ingredient_id: ingredient.ingredient_id },
    });
  }

  // Segments
  const segCount = faker.number.int({ min: 1, max: 3 });
  for (let i = 1; i <= segCount; i++) {
    const segId = uuidv4();
    await prisma.segment.create({
      data: {
        segment_id: segId,
        title: `Step ${i}`,
        paragraph: faker.lorem.sentences({ min: 2, max: 5 }),
        order_num: i,
      },
    });
    await prisma.content_segment.create({
      data: { content_id: contentId, segment_id: segId, position: i },
    });
  }
}

async function createArticle(style, author) {
  const publicationId = uuidv4();
  const articleType = await prisma.category.findFirst({
    where: { str_value: 'Article', type: 'Type' },
  });

  await prisma.publication.create({
    data: {
      publication_id: publicationId,
      title: faker.lorem.words({ min: 3, max: 7 }),
      description: [faker.lorem.sentences({ min: 2, max: 5 })],
      note: [],
      public: true,
      published: true,
      type_id: articleType.category_id,
      style_id: style.category_id,
      author_id: author.category_id,
    },
  });

  const numContents = faker.number.int({ min: 1, max: 2 });
  for (let i = 0; i < numContents; i++) {
    const contentId = uuidv4();
    await prisma.content.create({
      data: {
        content_id: contentId,
        publication_id: publicationId,
        servings: null,
        total_prep_time: 0,
      },
    });

    const numSegments = faker.number.int({ min: 3, max: 7 });
    for (let s = 1; s <= numSegments; s++) {
      const segId = uuidv4();
      await prisma.segment.create({
        data: {
          segment_id: segId,
          title: faker.lorem.words({ min: 2, max: 4 }),
          paragraph: faker.lorem.paragraph(),
          order_num: s,
        },
      });
      await prisma.content_segment.create({
        data: { content_id: contentId, segment_id: segId, position: s },
      });
    }
  }
}

async function createReview(product, publication) {
  const reviewId = uuidv4();
  const targetProduct = Math.random() < 0.5;
  return prisma.review.create({
    data: {
      review_id: reviewId,
      product_id: targetProduct ? product.product_id : null,
      publication_id: targetProduct ? null : publication.publication_id,
      rating: faker.number.int({ min: 1, max: 5 }),
      comment: [faker.lorem.sentence()],
      description: [faker.lorem.paragraph()],
      buy_again: targetProduct ? 'Y' : 'N',
    },
  });
}

// ---------------------------
// Main
// ---------------------------
async function main() {
  // 1. Ensure base user + taxonomy
  await ensureUser('admin', 'admin123', 'admin');
  await ensureCategory('Book', 'Type');
  await ensureCategory('Recipe', 'Type');
  await ensureCategory('Article', 'Type');
  await ensureCategory('Review', 'Type');
  const styleBreakfast = await ensureCategory('Breakfast', 'Style');
  const authorJulia = await ensureCategory('Julia Child', 'Author');

  // 2. Create base product catalog
  const products = [];
  for (let i = 0; i < 20; i++) {
    products.push(await createProduct());
  }

  // 3. Generate ~100 publications
  const total = 100;
  for (let i = 0; i < total; i++) {
    const r = Math.random();
    const product = faker.helpers.arrayElement(products);

    if (r < 0.15) {
      await createBook(styleBreakfast, authorJulia);
    } else if (r < 0.55) {
      await createRecipe(styleBreakfast, authorJulia, product);
    } else if (r < 0.80) {
      await createArticle(styleBreakfast, authorJulia);
    } else {
      // reviews need a valid target
      const pub = await prisma.publication.findFirst();
      if (pub) await createReview(product, pub);
    }
  }

  console.log('✅ Mass seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
