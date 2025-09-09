import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // =========================================================
  // INSERT CATEGORIES
  // =========================================================
  const categories = [
    { strValue: 'Fruit', type: 'FoodGroup' },
    { strValue: 'Légume', type: 'FoodGroup' },
    { strValue: 'Viande', type: 'FoodGroup' },
    { strValue: 'Poisson', type: 'FoodGroup' },
    { strValue: 'Épice', type: 'FoodGroup' },
    { strValue: 'Produit laitier', type: 'FoodGroup' },
    { strValue: 'Céréale', type: 'FoodGroup' },
    { strValue: 'Légumineuse', type: 'FoodGroup' },
    { strValue: 'Noix & graines', type: 'FoodGroup' },
    { strValue: 'Boisson', type: 'FoodGroup' },
  ];

  const categoryMap = {};
  for (const cat of categories) {
    const created = await prisma.category.create({ data: cat });
    categoryMap[cat.strValue] = created.categoryId;
  }

  // =========================================================
  // INSERT MACRO + PRODUCT
  // =========================================================
  const products = [
    { name: 'Fraises', enName: 'Strawberries', macro: { calories:32, protein:1, fiber:2, sugar:4, saturated:0, trans:0, caffein:0 }, category: 'Fruit' },
    { name: 'Poitrine de poulet', enName: 'Chicken breast', macro: { calories:165, protein:31, fiber:0, sugar:0, saturated:1, trans:0, caffein:0 }, category: 'Viande' },
    { name: 'Pomme', enName: 'Apple', macro: { calories:52, protein:0, fiber:2, sugar:10, saturated:0, trans:0, caffein:0 }, category: 'Fruit' },
    { name: 'Brocoli', enName: 'Broccoli', macro: { calories:34, protein:3, fiber:3, sugar:2, saturated:0, trans:0, caffein:0 }, category: 'Légume' },
    { name: 'Riz blanc', enName: 'White rice', macro: { calories:130, protein:2, fiber:0, sugar:0, saturated:0, trans:0, caffein:0 }, category: 'Céréale' },
    { name: 'Amandes', enName: 'Almonds', macro: { calories:579, protein:21, fiber:12, sugar:4, saturated:4, trans:0, caffein:0 }, category: 'Noix & graines' },
    { name: 'Saumon', enName: 'Salmon', macro: { calories:208, protein:20, fiber:0, sugar:0, saturated:3, trans:0, caffein:0 }, category: 'Poisson' },
    { name: 'Lait', enName: 'Milk', macro: { calories:42, protein:3, fiber:0, sugar:5, saturated:1, trans:0, caffein:0 }, category: 'Produit laitier' },
    { name: 'Œuf', enName: 'Egg', macro: { calories:155, protein:13, fiber:0, sugar:1, saturated:3, trans:0, caffein:0 }, category: 'Produit laitier' },
    { name: 'Cannelle', enName: 'Cinnamon', macro: { calories:247, protein:4, fiber:54, sugar:2, saturated:1, trans:0, caffein:0 }, category: 'Épice' },
    { name: 'Banane', enName: 'Banana', macro: { calories:89, protein:1, fiber:2, sugar:12, saturated:0, trans:0, caffein:0 }, category: 'Fruit' },
    { name: 'Orange', enName: 'Orange', macro: { calories:47, protein:1, fiber:2, sugar:9, saturated:0, trans:0, caffein:0 }, category: 'Fruit' },
    { name: 'Carotte', enName: 'Carrot', macro: { calories:41, protein:1, fiber:3, sugar:5, saturated:0, trans:0, caffein:0 }, category: 'Légume' },
    { name: 'Lentilles', enName: 'Lentils', macro: { calories:116, protein:9, fiber:8, sugar:2, saturated:0, trans:0, caffein:0 }, category: 'Légumineuse' },
    { name: 'Pois chiches', enName: 'Chickpeas', macro: { calories:164, protein:9, fiber:8, sugar:3, saturated:0, trans:0, caffein:0 }, category: 'Légumineuse' },
    { name: 'Noix de cajou', enName: 'Cashews', macro: { calories:553, protein:18, fiber:3, sugar:6, saturated:8, trans:0, caffein:0 }, category: 'Noix & graines' },
    { name: 'Pain complet', enName: 'Whole wheat bread', macro: { calories:247, protein:13, fiber:7, sugar:4, saturated:1, trans:0, caffein:0 }, category: 'Céréale' },
    { name: 'Fromage cheddar', enName: 'Cheddar cheese', macro: { calories:403, protein:25, fiber:0, sugar:0, saturated:21, trans:0, caffein:0 }, category: 'Produit laitier' },
    { name: 'Thon', enName: 'Tuna', macro: { calories:132, protein:28, fiber:0, sugar:0, saturated:1, trans:0, caffein:0 }, category: 'Poisson' },
    { name: 'Café noir', enName: 'Black coffee', macro: { calories:1, protein:0, fiber:0, sugar:0, saturated:0, trans:0, caffein:95 }, category: 'Boisson' },
    { name: 'Vin rouge', enName: 'Red wine', macro: { calories:85, protein:0, fiber:0, sugar:1, saturated:0, trans:0, caffein:0 }, category: 'Boisson' },
  ];

  for (const p of products) {
    const macro = await prisma.macro.create({ data: p.macro });
    await prisma.product.create({
      data: {
        name: p.name,
        enName: p.enName,
        macroId: macro.macroId,
        categoryId: categoryMap[p.category],
      },
    });
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
