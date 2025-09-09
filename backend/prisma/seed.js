import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("⚡ Seed start");

  // --- Units ---
  const unitGram = await prisma.unit.upsert({
    where: { name: "g" },
    update: {},
    create: { name: "g" },
  });

  const unitPiece = await prisma.unit.upsert({
    where: { name: "piece" },
    update: {},
    create: { name: "piece" },
  });

  // --- Categories ---
  const categoriesData = [
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

  const categories = await Promise.all(
    categoriesData.map(c =>
      prisma.category.upsert({
        where: { strValue_type: { strValue: c.strValue, type: c.type } },
        update: {},
        create: c,
      })
    )
  );

  const catMap = Object.fromEntries(categories.map(c => [c.strValue, c]));

  // --- Macros ---
  const [macroTomato, macroPasta] = await Promise.all([
    prisma.macro.create({ data: { calories: 18, protein: 1, fiber: 1 } }),
    prisma.macro.create({ data: { calories: 131, protein: 5, fiber: 2 } }),
  ]);

  // --- Products ---
  const [tomato, pasta] = await Promise.all([
    prisma.product.create({ data: { name: "Tomato", categoryId: catMap["Recipe"].categoryId, macroId: macroTomato.macroId } }),
    prisma.product.create({ data: { name: "Pasta", categoryId: catMap["Recipe"].categoryId, macroId: macroPasta.macroId } }),
  ]);

  // --- Publications Feeds ---
  const pubPastaRecipe = await prisma.publication.create({
    data: {
      title: "How to cook pasta",
      description: ["Step by step guide."],
      note: [],
      published: true,
      public: true,
      typeId: catMap["Recipe"].categoryId,
      styleId: catMap["Italian"].categoryId,
      thumbnail: "https://picsum.photos/200/200",
    },
  });

  const pubSolidArticle = await prisma.publication.create({
    data: {
      title: "Intro to SolidJS",
      description: ["Understanding reactive UI frameworks."],
      note: [],
      published: true,
      public: true,
      typeId: catMap["Article"].categoryId,
      styleId: catMap["French"].categoryId,
      thumbnail: "https://picsum.photos/200/201",
    },
  });

  // --- Resource ---
  const resource = await prisma.resource.create({ data: { urlId: catMap["default-url"].categoryId } });

  // --- Publications Library ---
  const pubJSBook = await prisma.publication.create({
    data: {
      title: "JavaScript: The Good Parts",
      description: ["Classic JS book."],
      note: [],
      published: true,
      public: true,
      typeId: catMap["Book"].categoryId,
      thumbnail: "https://picsum.photos/200/202",
      resourceId: resource.resourceId,
    },
  });

  const pubSolidReview = await prisma.publication.create({
    data: {
      title: "User Reviews on SolidJS",
      description: ["Compilation of reviews."],
      note: [],
      published: true,
      public: true,
      typeId: catMap["Review"].categoryId,
      thumbnail: "https://picsum.photos/200/203",
    },
  });

  // --- Ingredients ---
  const ingTomato = await prisma.ingredient.create({
    data: { productId: tomato.productId, quantity: 200, isRecipeId: pubPastaRecipe.publicationId },
  });

  const ingPasta = await prisma.ingredient.create({
    data: { productId: pasta.productId, quantity: 100, isRecipeId: pubPastaRecipe.publicationId },
  });

  // --- IngredientUnit ---
  await Promise.all([
    prisma.ingredientUnit.upsert({
      where: { ingredientId_unitId: { ingredientId: ingTomato.ingredientId, unitId: unitGram.unitId } },
      update: {},
      create: { ingredientId: ingTomato.ingredientId, unitId: unitGram.unitId },
    }),
    prisma.ingredientUnit.upsert({
      where: { ingredientId_unitId: { ingredientId: ingPasta.ingredientId, unitId: unitGram.unitId } },
      update: {},
      create: { ingredientId: ingPasta.ingredientId, unitId: unitGram.unitId },
    }),
  ]);

  // --- Content ---
  const contentPasta = await prisma.content.create({
    data: {
      title: "Pasta Recipe Content",
      description: ["Content describing pasta steps."],
      note: [],
      totalPrepTime: 30,
      servings: 2,
      categoryId: catMap["Recipe"].categoryId,
    },
  });

  const contentSolid = await prisma.content.create({
    data: {
      title: "SolidJS Article Content",
      description: ["Content about SolidJS."],
      note: [],
      totalPrepTime: 10,
      servings: 1,
      categoryId: catMap["Article"].categoryId,
    },
  });

  // --- ResourceContent ---
  await prisma.resourceContent.upsert({
    where: { resourceId_contentId: { resourceId: resource.resourceId, contentId: contentSolid.contentId } },
    update: {},
    create: { resourceId: resource.resourceId, contentId: contentSolid.contentId },
  });

  // --- ResourcePublication ---
  await prisma.resourcePublication.upsert({
    where: { resourceId_publicationId: { resourceId: resource.resourceId, publicationId: pubSolidReview.publicationId } },
    update: {},
    create: { resourceId: resource.resourceId, publicationId: pubSolidReview.publicationId, orderInBook: 1 },
  });

  // --- Reviews ---
  await prisma.review.create({
    data: {
      productId: tomato.productId,
      publicationId: pubPastaRecipe.publicationId,
      rating: 5,
      comment: ["Excellent!"],
      description: ["Very tasty pasta."],
      buyAgain: "T",
    },
  });

  await prisma.review.create({
    data: {
      productId: pasta.productId,
      publicationId: pubPastaRecipe.publicationId,
      rating: 4,
      comment: ["Good."],
      description: ["Cooked well."],
      buyAgain: "T",
    },
  });

  // --- Test user ---
  const hashed = await bcrypt.hash("test123", 10);

  await prisma.appUser.create({
    data: {
      username: "dratharias",
      password: hashed,
      role: "admin",
    },
  });

  console.log("✅ Seed complet terminé !");
  console.log("✅ Seeded test user !");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
