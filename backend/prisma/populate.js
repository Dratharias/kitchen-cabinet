import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const DISTRIBUTION = {
  Book: 0.15,
  Recipe: 0.40,
  Article: 0.25,
  Review: 0.20,
};

// ======= Helper to pick a type based on weighted distribution =======
function pickPublicationType() {
  const r = Math.random();
  let sum = 0;
  for (const [type, weight] of Object.entries(DISTRIBUTION)) {
    sum += weight;
    if (r <= sum) return type;
  }
  return 'Recipe'; // fallback
}

// ======= Seed Catalog Data (products, categories, authors, units) =======
async function bootstrapCatalog() {
  // Create a reusable set of products with macros + units
  for (let i = 0; i < 30; i++) {
    const macro = await prisma.macro.create({
      data: {
        macro_id: uuidv4(),
        calories: faker.number.int({ min: 50, max: 800 }),
        protein: faker.number.int({ min: 1, max: 50 }),
        fiber: faker.number.int({ min: 0, max: 20 }),
        sugar: faker.number.int({ min: 0, max: 30 }),
        saturated: faker.number.int({ min: 0, max: 10 }),
        trans: faker.number.int({ min: 0, max: 5 }),
        caffein: faker.number.int({ min: 0, max: 200 }),
      },
    });

    await prisma.product.create({
      data: {
        product_id: uuidv4(),
        name: faker.commerce.product(),
        en_name: faker.commerce.productName(),
        macro_id: macro.macro_id,
      },
    });
  }

  // Create some units
  const units = ['g', 'kg', 'ml', 'l', 'cup', 'tbsp', 'tsp'];
  for (const u of units) {
    await prisma.unit.create({
      data: { unit_id: uuidv4(), name: u },
    });
  }

  // Authors, styles
  const authors = ['Julia Child', 'Mark Bittman', 'Nigella Lawson', 'Kenji López-Alt'];
  for (const a of authors) {
    await prisma.category.create({
      data: { category_id: uuidv4(), str_value: a, type: 'Author' },
    });
  }

  const styles = ['Breakfast', 'Dinner', 'French', 'Italian', 'Vegan'];
  for (const s of styles) {
    await prisma.category.create({
      data: { category_id: uuidv4(), str_value: s, type: 'Style' },
    });
  }
}

// ======= Main Publication Generator =======
async function createPublication(type) {
  const publicationId = uuidv4();
  const style = await prisma.category.findFirst({ where: { type: 'Style' } });
  const author = await prisma.category.findFirst({ where: { type: 'Author' } });

  const pub = await prisma.publication.create({
    data: {
      publication_id: publicationId,
      title: faker.lorem.sentence(),
      description: [faker.lorem.paragraph()],
      note: [faker.lorem.sentence()],
      public: true,
      published: true,
      type_id: (await prisma.category.findFirst({ where: { str_value: type } }))?.category_id,
      style_id: style?.category_id,
      author_id: author?.category_id,
    },
  });

  switch (type) {
    case 'Book': return createBook(pub.publication_id);
    case 'Recipe': return createRecipe(pub.publication_id);
    case 'Article': return createArticle(pub.publication_id);
    case 'Review': return createReview(pub.publication_id);
  }
}

// ======= Type-specific Generators =======
async function createBook(pubId) {
  const chapters = faker.number.int({ min: 3, max: 8 });
  for (let i = 0; i < chapters; i++) {
    const contentId = uuidv4();
    await prisma.content.create({
      data: { content_id: contentId, publication_id: pubId, servings: null },
    });

    // Add segments
    const segs = faker.number.int({ min: 3, max: 6 });
    for (let j = 0; j < segs; j++) {
      const segId = uuidv4();
      await prisma.segment.create({
        data: {
          segment_id: segId,
          title: faker.lorem.words(3),
          paragraph: faker.lorem.paragraph(),
          order_num: j,
        },
      });
      await prisma.content_segment.create({
        data: { content_id: contentId, segment_id: segId, position: j },
      });
    }
  }
}

async function createRecipe(pubId) {
  const contentId = uuidv4();
  await prisma.content.create({
    data: { content_id: contentId, publication_id: pubId, servings: faker.number.int({ min: 1, max: 8 }) },
  });

  // Prep time
  const prepId = uuidv4();
  await prisma.prep_time.create({
    data: { prep_time_id: prepId, duration: faker.number.int({ min: 5, max: 120 }) },
  });
  await prisma.content_prep_time.create({
    data: { content_id: contentId, prep_time_id: prepId },
  });

  // Ingredients
  const products = await prisma.product.findMany({ take: 5 });
  const units = await prisma.unit.findMany();
  for (let i = 0; i < faker.number.int({ min: 3, max: 7 }); i++) {
    const product = faker.helpers.arrayElement(products);
    const ingrId = uuidv4();
    await prisma.ingredient.create({
      data: { ingredient_id: ingrId, product_id: product.product_id, quantity: faker.number.int({ min: 1, max: 500 }) },
    });
    const unit = faker.helpers.arrayElement(units);
    await prisma.ingredient_unit.create({
      data: { ingredient_id: ingrId, unit_id: unit.unit_id },
    });
    await prisma.content_ingredient.create({
      data: { content_id: contentId, ingredient_id: ingrId },
    });
  }
}

async function createArticle(pubId) {
  const contentId = uuidv4();
  await prisma.content.create({ data: { content_id: contentId, publication_id: pubId, servings: null } });
  const segs = faker.number.int({ min: 3, max: 5 });
  for (let j = 0; j < segs; j++) {
    const segId = uuidv4();
    await prisma.segment.create({
      data: { segment_id: segId, title: faker.lorem.words(3), paragraph: faker.lorem.paragraph(), order_num: j },
    });
    await prisma.content_segment.create({ data: { content_id: contentId, segment_id: segId, position: j } });
  }
}

async function createReview(pubId) {
  // Pick random product or publication
  if (Math.random() < 0.5) {
    const product = await prisma.product.findFirst();
    await prisma.review.create({
      data: {
        review_id: uuidv4(),
        product_id: product?.product_id,
        rating: faker.number.int({ min: 1, max: 5 }),
        comment: [faker.lorem.sentence()],
        description: [faker.lorem.paragraph()],
        buy_again: faker.helpers.arrayElement(['Y', 'N']),
      },
    });
  } else {
    await prisma.review.create({
      data: {
        review_id: uuidv4(),
        publication_id: pubId,
        rating: faker.number.int({ min: 1, max: 5 }),
        comment: [faker.lorem.sentence()],
        description: [faker.lorem.paragraph()],
        buy_again: faker.helpers.arrayElement(['Y', 'N']),
      },
    });
  }
}

// ======= Main =======
async function main() {
  await bootstrapCatalog();

  for (let i = 0; i < 100; i++) {
    const type = pickPublicationType();
    await createPublication(type);
  }

  console.log('✅ 100 coherent publications seeded!');
}

main().finally(() => prisma.$disconnect());
