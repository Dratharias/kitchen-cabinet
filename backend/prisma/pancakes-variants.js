import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

(async () => {
  console.log('🥞 Creating Pancakes with variants...');

  // Create tags
  const breakfast = await prisma.tag.upsert({
    where: { slug: 'breakfast' },
    update: {},
    create: { name: 'Breakfast', slug: 'breakfast', description: 'Breakfast recipes' },
  });

  const vegan = await prisma.tag.upsert({
    where: { slug: 'vegan' },
    update: {},
    create: { name: 'Vegan', slug: 'vegan', description: 'Plant-based recipes' },
  });

  // Get units
  const g = await prisma.unit.upsert({ where: { name: 'g' }, update: {}, create: { name: 'g' } });
  const ml = await prisma.unit.upsert({ where: { name: 'ml' }, update: {}, create: { name: 'ml' } });
  const tsp = await prisma.unit.upsert({ where: { name: 'tsp' }, update: {}, create: { name: 'tsp' } });
  const tbsp = await prisma.unit.upsert({ where: { name: 'tbsp' }, update: {}, create: { name: 'tbsp' } });

  // Create publication
  const pancakes = await prisma.publication.create({
    data: {
      title: 'Fluffy Pancakes',
      description: ['Light and fluffy pancakes perfect for breakfast'],
      note: ['Serve with maple syrup and fresh berries', 'Best eaten immediately while hot'],
      public: true,
      published: true,
    },
  });

  await prisma.publication_tag.createMany({
    data: [
      { publication_id: pancakes.publication_id, tag_id: breakfast.tag_id },
    ],
  });

  // === VARIANT 1: Classic Pancakes ===
  const classicContent = await prisma.content.create({
    data: {
      publication_id: pancakes.publication_id,
      subtitle: 'Classic Recipe',
      note: 'Traditional pancakes with eggs and milk',
      total_prep_time: 20,
      prep_time_note: '10 min prep, 10 min cooking',
      serving_yield: 8,
      serving_value: 'pancakes',
      gallery: [],
    },
  });

  // Classic ingredients
  const flour = await prisma.product.upsert({ where: { name: 'Flour' }, update: {}, create: { name: 'Flour' } });
  const milk = await prisma.product.upsert({ where: { name: 'Milk' }, update: {}, create: { name: 'Milk' } });
  const egg = await prisma.product.upsert({ where: { name: 'Egg' }, update: {}, create: { name: 'Egg' } });
  const butter = await prisma.product.upsert({ where: { name: 'Butter' }, update: {}, create: { name: 'Butter' } });
  const bakingPowder = await prisma.product.upsert({ where: { name: 'Baking Powder' }, update: {}, create: { name: 'Baking Powder' } });
  const salt = await prisma.product.upsert({ where: { name: 'Salt' }, update: {}, create: { name: 'Salt' } });
  const sugarProd = await prisma.product.upsert({ where: { name: 'Sugar' }, update: {}, create: { name: 'Sugar' } });

  const classicIngredients = [
    { product_id: flour.product_id, quantity: 200, unit_id: g.unit_id },
    { product_id: milk.product_id, quantity: 300, unit_id: ml.unit_id },
    { product_id: egg.product_id, quantity: 2, note: 'Large eggs' },
    { product_id: butter.product_id, quantity: 50, unit_id: g.unit_id, note: 'Melted' },
    { product_id: bakingPowder.product_id, quantity: 2, unit_id: tsp.unit_id },
    { product_id: salt.product_id, quantity: 0.5, unit_id: tsp.unit_id, note: 'Pinch' },
    { product_id: sugarProd.product_id, quantity: 2, unit_id: tbsp.unit_id },
  ];

  for (const ing of classicIngredients) {
    const ingredient = await prisma.ingredient.create({ data: ing });
    await prisma.content_ingredient.create({
      data: { content_id: classicContent.content_id, ingredient_id: ingredient.ingredient_id },
    });
  }

  // Classic steps
  const classicSteps = [
    { position: 1, title: 'Mix Dry', paragraph: 'In a bowl, whisk together flour, baking powder, salt, and sugar.' },
    { position: 2, title: 'Mix Wet', paragraph: 'In another bowl, beat eggs, then add milk and melted butter.' },
    { position: 3, title: 'Combine', paragraph: 'Pour wet ingredients into dry ingredients. Mix until just combined.', note: 'Do not overmix - lumps are OK' },
    { position: 4, title: 'Cook', paragraph: 'Heat a griddle over medium heat. Pour 1/4 cup batter per pancake. Cook until bubbles form, then flip.' },
    { position: 5, title: 'Serve', paragraph: 'Stack pancakes and serve hot with your favorite toppings.' },
  ];

  for (const step of classicSteps) {
    const segment = await prisma.segment.create({ 
      data: { title: step.title, paragraph: step.paragraph, note: step.note } 
    });
    await prisma.content_segment.create({
      data: { content_id: classicContent.content_id, segment_id: segment.segment_id, position: step.position },
    });
  }

  console.log('✅ Created Classic variant');

  // === VARIANT 2: Vegan Pancakes ===
  const veganContent = await prisma.content.create({
    data: {
      publication_id: pancakes.publication_id,
      subtitle: 'Vegan Recipe',
      note: 'Plant-based version - no eggs or dairy!',
      total_prep_time: 15,
      prep_time_note: '5 min prep, 10 min cooking',
      serving_yield: 8,
      serving_value: 'pancakes',
      gallery: [],
    },
  });

  // Add vegan tag to publication
  await prisma.publication_tag.create({
    data: { publication_id: pancakes.publication_id, tag_id: vegan.tag_id },
  });

  // Vegan ingredients
  const almondMilk = await prisma.product.upsert({ 
    where: { name: 'Almond Milk' }, 
    update: {}, 
    create: { name: 'Almond Milk' } 
  });
  const coconutOil = await prisma.product.upsert({ 
    where: { name: 'Coconut Oil' }, 
    update: {}, 
    create: { name: 'Coconut Oil' } 
  });
  const appleSauce = await prisma.product.upsert({ 
    where: { name: 'Applesauce' }, 
    update: {}, 
    create: { name: 'Applesauce' } 
  });
  const vanillaExt = await prisma.product.upsert({ 
    where: { name: 'Vanilla Extract' }, 
    update: {}, 
    create: { name: 'Vanilla Extract' } 
  });

  const veganIngredients = [
    { product_id: flour.product_id, quantity: 200, unit_id: g.unit_id },
    { product_id: almondMilk.product_id, quantity: 300, unit_id: ml.unit_id, note: 'Or any plant milk' },
    { product_id: appleSauce.product_id, quantity: 60, unit_id: g.unit_id, note: 'Replaces eggs' },
    { product_id: coconutOil.product_id, quantity: 30, unit_id: ml.unit_id, note: 'Melted' },
    { product_id: bakingPowder.product_id, quantity: 2, unit_id: tsp.unit_id },
    { product_id: salt.product_id, quantity: 0.5, unit_id: tsp.unit_id },
    { product_id: sugarProd.product_id, quantity: 2, unit_id: tbsp.unit_id },
    { product_id: vanillaExt.product_id, quantity: 1, unit_id: tsp.unit_id, note: 'Optional' },
  ];

  for (const ing of veganIngredients) {
    const ingredient = await prisma.ingredient.create({ data: ing });
    await prisma.content_ingredient.create({
      data: { content_id: veganContent.content_id, ingredient_id: ingredient.ingredient_id },
    });
  }

  // Vegan steps
  const veganSteps = [
    { position: 1, title: 'Mix Dry', paragraph: 'Whisk flour, baking powder, salt, and sugar in a large bowl.' },
    { position: 2, title: 'Mix Wet', paragraph: 'Combine almond milk, applesauce, melted coconut oil, and vanilla.', note: 'Applesauce acts as egg replacer' },
    { position: 3, title: 'Combine', paragraph: 'Add wet to dry ingredients. Stir gently until combined.', note: 'Batter will be slightly thicker than classic' },
    { position: 4, title: 'Rest', paragraph: 'Let batter rest for 5 minutes to thicken.', note: 'This helps with fluffiness' },
    { position: 5, title: 'Cook', paragraph: 'Heat griddle over medium heat. Pour batter and cook until bubbles form, flip and cook other side.' },
    { position: 6, title: 'Serve', paragraph: 'Serve with maple syrup, fresh fruit, or vegan butter.' },
  ];

  for (const step of veganSteps) {
    const segment = await prisma.segment.create({ 
      data: { title: step.title, paragraph: step.paragraph, note: step.note } 
    });
    await prisma.content_segment.create({
      data: { content_id: veganContent.content_id, segment_id: segment.segment_id, position: step.position },
    });
  }

  console.log('✅ Created Vegan variant');
  console.log('🎉 Fluffy Pancakes created with 2 variants!');
  
  await prisma.$disconnect();
})();
