import { PrismaClient, Prisma } from "@prisma/client";
import { faker } from "@faker-js/faker";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ---------------------------
// Helpers
// ---------------------------
async function ensureCategory(str_value, type) {
  const found = await prisma.category.findFirst({ where: { str_value, type } });
  if (found) return found;
  return prisma.category.create({
    data: { category_id: uuidv4(), str_value, type },
  });
}

async function ensureUser(username, password, role = "user") {
  const found = await prisma.app_user.findUnique({ where: { username } });
  if (found) return found;

  const hashed = await bcrypt.hash(password, 10);
  return prisma.app_user.create({
    data: {
      user_id: uuidv4(),
      username,
      password: hashed,
      role,
    },
  });
}

async function createProduct(existingNames = new Set()) {
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

  // éviter doublons sur product.name (unique)
  let name = faker.commerce.productName();
  while (existingNames.has(name)) {
    name = faker.commerce.productName();
  }
  existingNames.add(name);

  return prisma.product.create({
    data: {
      product_id: uuidv4(),
      name,
      macro_id: macroId,
    },
  });
}

async function createIngredient(product) {
  const unit = await prisma.unit.upsert({
    where: { name: "grams" },
    update: {},
    create: { unit_id: uuidv4(), name: "grams" },
  });

  const ingredientId = uuidv4();
  await prisma.ingredient.create({
    data: {
      ingredient_id: ingredientId,
      quantity: faker.number.int({ min: 1, max: 500 }),
      product_id: product.product_id,
      multiply_factor: new Prisma.Decimal(
        faker.number.float({ min: 0.01, max: 1.0, precision: 0.01 }),
      ),
    },
  });

  await prisma.ingredient_unit.create({
    data: { ingredient_id: ingredientId, unit_id: unit.unit_id },
  });

  return { ingredient_id: ingredientId };
}

async function addTagsToPublication(publicationId, availableTags) {
  const tagCount = faker.number.int({ min: 1, max: 4 });
  const selectedTags = faker.helpers.arrayElements(availableTags, tagCount);

  for (const tag of selectedTags) {
    await prisma.publication_tag.create({
      data: { publication_id: publicationId, category_id: tag.category_id },
    });
  }
}

// ---------------------------
// Reviews
// ---------------------------
async function createReviewForPublication(pub) {
  return prisma.review.create({
    data: {
      review_id: uuidv4(),
      publication_id: pub.publication_id,
      product_id: null,
      rating: faker.number.int({ min: 1, max: 5 }),
      comment: [faker.lorem.sentence()],
      description: [faker.lorem.paragraph()],
      buy_again: "N",
    },
  });
}

async function createReviewForProduct(product) {
  return prisma.review.create({
    data: {
      review_id: uuidv4(),
      product_id: product.product_id,
      publication_id: null,
      rating: faker.number.int({ min: 1, max: 5 }),
      comment: [faker.lorem.sentence()],
      description: [faker.lorem.paragraph()],
      buy_again: "Y",
    },
  });
}

// ---------------------------
// Publication Archetypes
// ---------------------------
async function createBookOrCookbook(typeName, style, author, availableTags) {
  const pubId = uuidv4();
  const type = await prisma.category.findFirst({
    where: { str_value: typeName, type: "Type" },
  });

  const pub = await prisma.publication.create({
    data: {
      publication_id: pubId,
      title: faker.lorem.words({ min: 2, max: 5 }),
      description: [faker.lorem.paragraph()],
      note: [faker.lorem.sentence()],
      public: true,
      published: true,
      thumbnail: faker.image.url({ width: 640, height: 480, category: "food" }),
      type_id: type.category_id,
      style_id: style.category_id,
      author_id: author.category_id,
    },
  });

  await addTagsToPublication(pubId, availableTags);

  const chapters = faker.number.int({ min: 3, max: 8 });
  for (let i = 1; i <= chapters; i++) {
    const contentId = uuidv4();
    await prisma.content.create({
      data: {
        content_id: contentId,
        publication_id: pubId,
        servings: 4,
        total_prep_time: 0,
      },
    });

    const segments = faker.number.int({ min: 2, max: 6 });
    for (let s = 1; s <= segments; s++) {
      const segId = uuidv4();
      // paragraph doit être unique
      await prisma.segment.create({
        data: {
          segment_id: segId,
          title: `${typeName} Chapter ${i} - Section ${s}`,
          paragraph: `${faker.lorem.paragraph()} [${segId}]`,
        },
      });
      await prisma.content_segment.create({
        data: { content_id: contentId, segment_id: segId, position: s },
      });
    }
  }

  if (Math.random() < 0.6) {
    const count = faker.number.int({ min: 1, max: 4 });
    for (let i = 0; i < count; i++) await createReviewForPublication(pub);
  }

  return pub;
}

async function createRecipe(
  style,
  author,
  products,
  availableTags,
  prepTimeCategories,
) {
  const pubId = uuidv4();
  const type = await prisma.category.findFirst({
    where: { str_value: "Recipe", type: "Type" },
  });

  const pub = await prisma.publication.create({
    data: {
      publication_id: pubId,
      title: faker.commerce.productName() + " Recipe",
      description: [faker.lorem.paragraph()],
      note: [faker.lorem.sentence()],
      public: true,
      published: true,
      thumbnail: faker.image.url({ width: 640, height: 480, category: "food" }),
      type_id: type.category_id,
      style_id: style.category_id,
      author_id: author.category_id,
    },
  });

  await addTagsToPublication(pubId, availableTags);

  const contentId = uuidv4();
  await prisma.content.create({
    data: {
      content_id: contentId,
      publication_id: pubId,
      servings: faker.number.int({ min: 1, max: 8 }),
      total_prep_time: 0,
    },
  });

  let totalPrepTime = 0;
  const prepTimesCount = faker.number.int({ min: 1, max: 4 });
  for (let i = 0; i < prepTimesCount; i++) {
    const prepDuration = faker.number.int({ min: 10, max: 90 });
    const prepCategory = faker.helpers.arrayElement(prepTimeCategories);

    const prepTime = await prisma.prep_time.create({
      data: {
        prep_time_id: uuidv4(),
        duration: prepDuration,
        style_id: prepCategory.category_id,
      },
    });

    await prisma.content_prep_time.create({
      data: { content_id: contentId, prep_time_id: prepTime.prep_time_id },
    });

    totalPrepTime += prepDuration;
  }

  await prisma.content.update({
    where: { content_id: contentId },
    data: { total_prep_time: totalPrepTime },
  });

  const ingredientsCount = faker.number.int({ min: 2, max: 6 });
  for (let i = 0; i < ingredientsCount; i++) {
    const product = faker.helpers.arrayElement(products);
    const ingredient = await createIngredient(product);
    await prisma.content_ingredient.create({
      data: { content_id: contentId, ingredient_id: ingredient.ingredient_id },
    });

    // Lien produit → recette
    await prisma.product.update({
      where: { product_id: product.product_id },
      data: { is_recipe_id: pubId },
    });
  }

  const segmentsCount = faker.number.int({ min: 1, max: 3 });
  for (let i = 1; i <= segmentsCount; i++) {
    const segId = uuidv4();
    await prisma.segment.create({
      data: {
        segment_id: segId,
        title: `Step ${i}`,
        paragraph: `${faker.lorem.sentences({ min: 2, max: 5 })} [${segId}]`,
      },
    });
    await prisma.content_segment.create({
      data: { content_id: contentId, segment_id: segId, position: i },
    });
  }

  if (Math.random() < 0.7) {
    const reviewsCount = faker.number.int({ min: 1, max: 5 });
    for (let i = 0; i < reviewsCount; i++)
      await createReviewForPublication(pub);
  }

  return pub;
}

async function createArticleOrFoodPost(typeName, style, author, availableTags) {
  const pubId = uuidv4();
  const type = await prisma.category.findFirst({
    where: { str_value: typeName, type: "Type" },
  });

  const pub = await prisma.publication.create({
    data: {
      publication_id: pubId,
      title: faker.lorem.words({ min: 3, max: 7 }),
      description: [faker.lorem.sentences({ min: 2, max: 5 })],
      note: [],
      public: true,
      published: true,
      thumbnail: faker.image.url({ width: 640, height: 480, category: "food" }),
      type_id: type.category_id,
      style_id: style.category_id,
      author_id: author.category_id,
    },
  });

  await addTagsToPublication(pubId, availableTags);

  const contents = faker.number.int({ min: 1, max: 2 });
  for (let i = 0; i < contents; i++) {
    const contentId = uuidv4();
    await prisma.content.create({
      data: {
        content_id: contentId,
        publication_id: pubId,
        servings: null,
        total_prep_time: 0,
      },
    });

    const segments = faker.number.int({ min: 3, max: 7 });
    for (let s = 1; s <= segments; s++) {
      const segId = uuidv4();
      await prisma.segment.create({
        data: {
          segment_id: segId,
          title: faker.lorem.words({ min: 2, max: 4 }),
          paragraph: `${faker.lorem.paragraph()} [${segId}]`,
        },
      });
      await prisma.content_segment.create({
        data: { content_id: contentId, segment_id: segId, position: s },
      });
    }
  }

  if (Math.random() < 0.5) {
    const count = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < count; i++) await createReviewForPublication(pub);
  }

  return pub;
}

// ---------------------------
// Main
// ---------------------------
async function main() {
  await ensureUser("admin", "admin123", "admin");

  const typeNames = [
    "Book",
    "Cookbook",
    "Article",
    "FoodPost",
    "Recipe",
    "Review",
  ];
  for (const t of typeNames) {
    await ensureCategory(t, "Type");
  }

  const styleBreakfast = await ensureCategory("Breakfast", "Style");
  const authorJulia = await ensureCategory("Julia Child", "Author");

  const tagNames = [
    "Healthy",
    "Quick",
    "Vegetarian",
    "Vegan",
    "Gluten-Free",
    "Low-Carb",
    "High-Protein",
    "Comfort Food",
    "Spicy",
    "Sweet",
    "Savory",
    "Mediterranean",
    "Asian",
    "Mexican",
    "Italian",
    "American",
    "French",
    "Indian",
    "Thai",
    "Chinese",
  ];

  const availableTags = [];
  for (const tagName of tagNames)
    availableTags.push(await ensureCategory(tagName, "Tag"));

  const prepTimeCategoryNames = ["Prep", "Cook", "Rest", "Chill"];
  const prepTimeCategories = [];
  for (const name of prepTimeCategoryNames)
    prepTimeCategories.push(await ensureCategory(name, "PrepTime"));

  const products = [];
  const existingNames = new Set();
  for (let i = 0; i < 20; i++)
    products.push(await createProduct(existingNames));

  const pubs = [];
  const recipes = [];
  const total = 100;

  for (let i = 0; i < total; i++) {
    const r = Math.random();

    if (r < 0.1) {
      pubs.push(
        await createBookOrCookbook(
          "Book",
          styleBreakfast,
          authorJulia,
          availableTags,
        ),
      );
    } else if (r < 0.25) {
      pubs.push(
        await createBookOrCookbook(
          "Cookbook",
          styleBreakfast,
          authorJulia,
          availableTags,
        ),
      );
    } else if (r < 0.45) {
      pubs.push(
        await createArticleOrFoodPost(
          "Article",
          styleBreakfast,
          authorJulia,
          availableTags,
        ),
      );
    } else if (r < 0.6) {
      pubs.push(
        await createArticleOrFoodPost(
          "FoodPost",
          styleBreakfast,
          authorJulia,
          availableTags,
        ),
      );
    } else if (r < 0.8) {
      const recipe = await createRecipe(
        styleBreakfast,
        authorJulia,
        products,
        availableTags,
        prepTimeCategories,
      );
      pubs.push(recipe);
      recipes.push(recipe);
    } else {
      if (Math.random() < 0.5) {
        const product = faker.helpers.arrayElement(products);
        await createReviewForProduct(product);
      } else if (pubs.length) {
        const pub = faker.helpers.arrayElement(pubs);
        await createReviewForPublication(pub);
      }
    }
  }

  // ---------------------------------
  // Lier quelques produits → recettes
  // ---------------------------------
  if (recipes.length > 0) {
    const sampleRecipes = faker.helpers.arrayElements(
      recipes,
      Math.min(3, recipes.length),
    );
    for (const recipe of sampleRecipes) {
      const sampleProducts = faker.helpers.arrayElements(
        products,
        faker.number.int({ min: 2, max: 5 }),
      );
      for (const product of sampleProducts) {
        await prisma.product.update({
          where: { product_id: product.product_id },
          data: { is_recipe_id: recipe.publication_id },
        });
      }
    }
  }

  console.log("✅ Mass seed completed with multi-product recipe references!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
