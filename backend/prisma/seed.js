import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function createUnits() {
  const units = ["g", "kg", "ml", "l", "piece"];
  return Promise.all(
    units.map(name =>
      prisma.unit.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );
}

async function createCategories() {
  const baseCategories = [
    { strValue: "Article", type: "Type" },
    { strValue: "Recipe", type: "Type" },
    { strValue: "Book", type: "Type" },
    { strValue: "Review", type: "Type" },
    { strValue: "Italian", type: "Style" },
    { strValue: "French", type: "Style" },
    { strValue: "Vegan", type: "Tag" },
    { strValue: "Gluten-Free", type: "Tag" },
    { strValue: "default-url", type: "URL" },
  ];

  const more = Array.from({ length: 16 }, () => ({
    strValue: faker.word.noun(),
    type: faker.helpers.arrayElement(["Type", "Style", "Tag", "URL"]),
  }));

  const categoriesData = [...baseCategories, ...more];

  const categories = await Promise.all(
    categoriesData.map(c =>
      prisma.category.upsert({
        where: { strValue_type: { strValue: c.strValue, type: c.type } },
        update: {},
        create: c,
      })
    )
  );

  return Object.fromEntries(categories.map(c => [c.strValue, c]));
}

async function createMacros(n) {
  return Promise.all(
    Array.from({ length: n }, () =>
      prisma.macro.create({
        data: {
          calories: faker.number.int({ min: 10, max: 500 }),
          protein: faker.number.int({ min: 0, max: 50 }),
          fiber: faker.number.int({ min: 0, max: 30 }),
        },
      })
    )
  );
}

async function createProducts(n, categories, macros) {
  return Promise.all(
    Array.from({ length: n }, () =>
      prisma.product.create({
        data: {
          name: faker.commerce.productName(),
          categoryId: categories["Recipe"].categoryId,
          macroId: faker.helpers.arrayElement(macros).macroId,
        },
      })
    )
  );
}

async function createPublications(n, categories) {
  return Promise.all(
    Array.from({ length: n }, () =>
      prisma.publication.create({
        data: {
          title: faker.lorem.words(3),
          description: [faker.lorem.sentence()],
          note: [],
          published: true,
          public: true,
          typeId: categories[faker.helpers.arrayElement(["Recipe", "Article", "Book", "Review"])].categoryId,
          styleId: categories[faker.helpers.arrayElement(["Italian", "French"])].categoryId,
          thumbnail: faker.image.urlPicsumPhotos({ width: 200, height: 200 }),
        },
      })
    )
  );
}

async function createIngredients(n, products, publications) {
  return Promise.all(
    Array.from({ length: n }, () =>
      prisma.ingredient.create({
        data: {
          productId: faker.helpers.arrayElement(products).productId,
          quantity: faker.number.int({ min: 50, max: 500 }),
          isRecipeId: faker.helpers.arrayElement(publications).publicationId,
        },
      })
    )
  );
}

async function createIngredientUnits(ingredients, units) {
  return Promise.all(
    ingredients.map(ing =>
      prisma.ingredientUnit.upsert({
        where: {
          ingredientId_unitId: {
            ingredientId: ing.ingredientId,
            unitId: units[0].unitId, // default to grams
          },
        },
        update: {},
        create: { ingredientId: ing.ingredientId, unitId: units[0].unitId },
      })
    )
  );
}

async function createContents(n, categories) {
  return Promise.all(
    Array.from({ length: n }, () =>
      prisma.content.create({
        data: {
          title: faker.lorem.words(4),
          description: [faker.lorem.sentences(2)],
          note: [],
          totalPrepTime: faker.number.int({ min: 10, max: 120 }),
          servings: faker.number.int({ min: 1, max: 8 }),
          categoryId: categories["Recipe"].categoryId,
        },
      })
    )
  );
}

async function createUsers() {
  const hashedAdmin = await bcrypt.hash("admin123", 10);
  const hashedUser = await bcrypt.hash("user123", 10);

  return Promise.all([
    prisma.appUser.create({
      data: { username: "admin", password: hashedAdmin, role: "admin" },
    }),
    prisma.appUser.create({
      data: { username: "user", password: hashedUser, role: "user" },
    }),
  ]);
}

async function main() {
  console.log("⚡ Seed start");

  const units = await createUnits();
  const categories = await createCategories();
  const macros = await createMacros(25);
  const products = await createProducts(25, categories, macros);
  const publications = await createPublications(25, categories);
  const ingredients = await createIngredients(25, products, publications);

  await createIngredientUnits(ingredients, units);
  await createContents(25, categories);
  await createUsers();

  console.log("✅ Seed complete with 25 entries per table and 2 users!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
