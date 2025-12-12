import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

(async () => {
  const creme = await prisma.publication.findFirst({
    where: { title: 'Crème Brûlée' },
    include: { contents: true }
  });
  
  if (!creme || !creme.contents[0]) {
    console.log('Crème Brûlée not found');
    process.exit(1);
  }
  
  const contentId = creme.contents[0].content_id;
  
  // Get or create units
  const ml = await prisma.unit.upsert({ where: { name: 'ml' }, update: {}, create: { name: 'ml' } });
  const tsp = await prisma.unit.upsert({ where: { name: 'tsp' }, update: {}, create: { name: 'tsp' } });
  const g = await prisma.unit.upsert({ where: { name: 'g' }, update: {}, create: { name: 'g' } });
  
  // Create products
  const cream = await prisma.product.upsert({ 
    where: { name: 'Heavy Cream' }, 
    update: {}, 
    create: { name: 'Heavy Cream' } 
  });
  const eggs = await prisma.product.upsert({ 
    where: { name: 'Egg Yolks' }, 
    update: {}, 
    create: { name: 'Egg Yolks' } 
  });
  const sugar = await prisma.product.upsert({ 
    where: { name: 'Sugar' }, 
    update: {}, 
    create: { name: 'Sugar' } 
  });
  const vanilla = await prisma.product.upsert({ 
    where: { name: 'Vanilla Extract' }, 
    update: {}, 
    create: { name: 'Vanilla Extract' } 
  });
  
  // Create ingredients
  const ingredients = [
    { product_id: cream.product_id, quantity: 500, unit_id: ml.unit_id },
    { product_id: eggs.product_id, quantity: 6, note: 'Large eggs' },
    { product_id: sugar.product_id, quantity: 100, unit_id: g.unit_id, note: 'Plus extra for topping' },
    { product_id: vanilla.product_id, quantity: 1, unit_id: tsp.unit_id },
  ];
  
  for (const ing of ingredients) {
    const ingredient = await prisma.ingredient.create({ data: ing });
    await prisma.content_ingredient.create({
      data: {
        content_id: contentId,
        ingredient_id: ingredient.ingredient_id,
      },
    });
  }
  
  // Create segments
  const steps = [
    { position: 1, title: 'Heat Cream', paragraph: 'Heat cream until just simmering. Remove from heat.', note: 'Do not boil' },
    { position: 2, title: 'Mix', paragraph: 'Whisk egg yolks, sugar, and vanilla until smooth.' },
    { position: 3, title: 'Temper', paragraph: 'Slowly pour hot cream into egg mixture while whisking constantly.', note: 'Prevents curdling' },
    { position: 4, title: 'Bake', paragraph: 'Pour into ramekins. Bake in water bath at 160°C for 40-45 minutes.' },
    { position: 5, title: 'Chill', paragraph: 'Refrigerate for at least 3 hours.' },
    { position: 6, title: 'Caramelize', paragraph: 'Sprinkle sugar on top. Use torch to caramelize until golden.' },
  ];
  
  for (const step of steps) {
    const segment = await prisma.segment.create({ 
      data: { 
        title: step.title, 
        paragraph: step.paragraph, 
        note: step.note 
      } 
    });
    await prisma.content_segment.create({
      data: {
        content_id: contentId,
        segment_id: segment.segment_id,
        position: step.position,
      },
    });
  }
  
  console.log('✅ Completed Crème Brûlée with 4 ingredients and 6 steps');
  await prisma.$disconnect();
})();
