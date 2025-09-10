import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const NUM_PUBLICATIONS = 50; // change to 1000 if needed
const NUM_PRODUCTS = 100;
const NUM_CONTENTS_PER_PUBLICATION = 5;
const NUM_PREPTIMES_PER_PUBLICATION = 5;

async function main() {
  console.log("Seeding database...");

  // --- Helper functions ---
  async function getOrCreateCategory(strValue, type) {
    let cat = await prisma.category.findFirst({ where: { strValue, type } });
    if (!cat) {
      cat = await prisma.category.create({ data: { strValue, type } });
    }
    return cat;
  }

  async function getOrCreateUnit(name) {
    let unit = await prisma.unit.findFirst({ where: { name } });
    if (!unit) {
      unit = await prisma.unit.create({ data: { name } });
    }
    return unit;
  }

  async function getOrCreateResource(urlCategory) {
    let res = await prisma.resource.findFirst({ where: { urlId: urlCategory.categoryId } });
    if (!res) {
      res = await prisma.resource.create({ data: { urlId: urlCategory.categoryId } });
    }
    return res;
  }

  // --- Categories ---
  const types = [
    await getOrCreateCategory("Recipe", "Type"),
    await getOrCreateCategory("Book", "Type"),
    await getOrCreateCategory("Article", "Type")
  ];

  const styles = [
    await getOrCreateCategory("Italian", "Style"),
    await getOrCreateCategory("French", "Style"),
    await getOrCreateCategory("Asian", "Style")
  ];

  const authors = [
    await getOrCreateCategory("Chef John", "Author"),
    await getOrCreateCategory("Chef Jane", "Author"),
    await getOrCreateCategory("Chef Lee", "Author")
  ];

  const urlCategory = await getOrCreateCategory("https://example.com", "URL");

  // --- Units ---
  const gram = await getOrCreateUnit("gram");
  const piece = await getOrCreateUnit("piece");
  const ml = await getOrCreateUnit("ml");
  const units = [gram, piece, ml];

  // --- Resources ---
  const cookbook = await getOrCreateResource(urlCategory);
  const website = await getOrCreateResource(urlCategory);
  const resources = [cookbook, website];

  // --- Generate Publications ---
  const publications = [];
  const resourceOrderCounter = { [cookbook.resourceId]: 1, [website.resourceId]: 1 };

  for (let i = 1; i <= NUM_PUBLICATIONS; i++) {
    const type = types[i % types.length];
    const style = styles[i % styles.length];
    const author = authors[i % authors.length];
    const res = resources[i % resources.length];

    const pub = await prisma.publication.create({
      data: {
        title: `Publication ${i}`,
        description: [`Step 1 for Publication ${i}`, `Step 2 for Publication ${i}`],
        note: ["Auto-generated"],
        public: true,
        published: true,
        typeId: type.categoryId,
        styleId: style.categoryId,
        authorId: author.categoryId,
      },
    });
    publications.push(pub);

    // Link ResourcePublication
    await prisma.resourcePublication.create({
      data: {
        resourceId: res.resourceId,
        publicationId: pub.publicationId,
        orderInBook: resourceOrderCounter[res.resourceId]++,
      },
    });
  }

  // --- Generate Products ---
  const products = [];
  for (let i = 1; i <= NUM_PRODUCTS; i++) {
    const type = types[i % types.length];
    const macro = await prisma.macro.create({
      data: {
        calories: Math.floor(Math.random() * 500),
        protein: Math.floor(Math.random() * 50),
        fiber: Math.floor(Math.random() * 20),
        sugar: Math.floor(Math.random() * 30),
        saturated: Math.floor(Math.random() * 20),
      },
    });

    const product = await prisma.product.create({
      data: {
        name: `Product ${i}`,
        categoryId: type.categoryId,
        macroId: macro.macroId,
      },
    });
    products.push(product);
  }

  // --- Ingredients ---
  for (let product of products) {
    const publication = publications[Math.floor(Math.random() * publications.length)];
    const unit = units[Math.floor(Math.random() * units.length)];
    await prisma.ingredient.create({
      data: {
        productId: product.productId,
        isRecipeId: publication.publicationId,
        quantity: Math.floor(Math.random() * 500),
        units: { create: [{ unitId: unit.unitId }] },
      },
    });
  }

  // --- Contents & PrepTimes ---
  for (let pub of publications) {
    const contents = [];
    const prepTimes = [];
    for (let i = 1; i <= NUM_CONTENTS_PER_PUBLICATION; i++) {
      const content = await prisma.content.create({
        data: {
          title: `Content for ${pub.title} - ${i}`,
          description: [`Do something ${i} for ${pub.title}`],
          note: ["Auto-generated"],
          categoryId: pub.typeId,
        },
      });
      contents.push(content);

      const prep = await prisma.prepTime.create({
        data: { duration: Math.floor(Math.random() * 60) + 5, categoryId: pub.typeId },
      });
      prepTimes.push(prep);
    }

    // Link Content-PrepTime and ResourceContent
    for (let j = 0; j < contents.length; j++) {
      await prisma.contentPrepTime.create({
        data: {
          contentId: contents[j].contentId,
          prepTimeId: prepTimes[j % prepTimes.length].prepTimeId,
        },
      });

      const res = resources[j % resources.length];
      await prisma.resourceContent.create({
        data: {
          contentId: contents[j].contentId,
          resourceId: res.resourceId,
        },
      });
    }
  }

  // --- Reviews ---
  for (let product of products) {
    const publication = publications[Math.floor(Math.random() * publications.length)];
    await prisma.review.create({
      data: {
        productId: product.productId,
        publicationId: publication.publicationId,
        rating: Math.floor(Math.random() * 5) + 1,
        comment: ["Auto-generated comment"],
        description: ["Auto-generated description"],
        buyAgain: "Y",
      },
    });
  }

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
