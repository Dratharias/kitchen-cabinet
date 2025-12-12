import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Adding more test publications...');

  // Create more tags
  const tags = {
    italian: await prisma.tag.upsert({
      where: { slug: 'italian' },
      update: {},
      create: { name: 'Italian', slug: 'italian', description: 'Italian cuisine' },
    }),
    french: await prisma.tag.upsert({
      where: { slug: 'french' },
      update: {},
      create: { name: 'French', slug: 'french', description: 'French cuisine' },
    }),
    pizza: await prisma.tag.upsert({
      where: { slug: 'pizza' },
      update: {},
      create: { name: 'Pizza', slug: 'pizza', description: 'Pizza recipes' },
    }),
    dessert: await prisma.tag.upsert({
      where: { slug: 'dessert' },
      update: {},
      create: { name: 'Dessert', slug: 'dessert', description: 'Sweet treats' },
    }),
  };

  // Create units
  const units = {
    g: await prisma.unit.upsert({ where: { name: 'g' }, update: {}, create: { name: 'g' } }),
    ml: await prisma.unit.upsert({ where: { name: 'ml' }, update: {}, create: { name: 'ml' } }),
    tsp: await prisma.unit.upsert({ where: { name: 'tsp' }, update: {}, create: { name: 'tsp' } }),
    tbsp: await prisma.unit.upsert({ where: { name: 'tbsp' }, update: {}, create: { name: 'tbsp' } }),
  };

  // Create Pizza Margherita
  const pizza = await prisma.publication.create({
    data: {
      title: 'Pizza Margherita',
      description: ['Classic Italian pizza with tomato, mozzarella, and basil'],
      note: ['Use fresh mozzarella for best results', 'Cook in a very hot oven'],
      public: true,
      published: true,
    },
  });

  await prisma.publication_tag.createMany({
    data: [
      { publication_id: pizza.publication_id, tag_id: tags.italian.tag_id },
      { publication_id: pizza.publication_id, tag_id: tags.pizza.tag_id },
    ],
  });

  const pizzaContent = await prisma.content.create({
    data: {
      publication_id: pizza.publication_id,
      subtitle: 'Traditional Recipe',
      note: 'This is the authentic Neapolitan style',
      total_prep_time: 90,
      prep_time_note: '15 min active, 75 min rising',
      serving_yield: 4,
      serving_value: 'pizzas',
      gallery: [
        { url: 'https://example.com/pizza1.jpg', label: 'Finished pizza' },
        { url: 'https://example.com/pizza2.jpg', label: 'Dough preparation' },
      ],
    },
  });

  // Pizza ingredients
  const flour = await prisma.product.create({ data: { name: 'Flour', description: 'All-purpose flour' } });
  const water = await prisma.product.create({ data: { name: 'Water' } });
  const salt = await prisma.product.create({ data: { name: 'Salt' } });
  const yeast = await prisma.product.create({ data: { name: 'Yeast' } });
  const tomato = await prisma.product.create({ data: { name: 'Tomato Sauce' } });
  const mozz = await prisma.product.create({ data: { name: 'Mozzarella' } });
  const basil = await prisma.product.create({ data: { name: 'Basil' } });

  const pizzaIngredients = [
    { product_id: flour.product_id, quantity: 500, unit_id: units.g.unit_id, note: 'Type 00 preferred' },
    { product_id: water.product_id, quantity: 325, unit_id: units.ml.unit_id, note: 'Lukewarm' },
    { product_id: salt.product_id, quantity: 10, unit_id: units.g.unit_id },
    { product_id: yeast.product_id, quantity: 3, unit_id: units.g.unit_id, note: 'Fresh yeast' },
    { product_id: tomato.product_id, quantity: 400, unit_id: units.g.unit_id },
    { product_id: mozz.product_id, quantity: 400, unit_id: units.g.unit_id, note: 'Fresh, drained' },
    { product_id: basil.product_id, note: 'Fresh leaves' },
  ];

  for (const ing of pizzaIngredients) {
    const ingredient = await prisma.ingredient.create({ data: ing });
    await prisma.content_ingredient.create({
      data: {
        content_id: pizzaContent.content_id,
        ingredient_id: ingredient.ingredient_id,
      },
    });
  }

  // Pizza steps
  const pizzaSteps = [
    { position: 1, title: 'Make Dough', paragraph: 'Mix flour and salt. Dissolve yeast in water, add to flour. Knead for 10 minutes.', note: 'Dough should be smooth and elastic' },
    { position: 2, title: 'First Rise', paragraph: 'Cover and let rise for 1 hour until doubled.', note: 'Keep in a warm place' },
    { position: 3, title: 'Shape', paragraph: 'Divide into 4 balls. Stretch each into a thin circle.', note: "Don't use a rolling pin" },
    { position: 4, title: 'Top', paragraph: 'Spread tomato sauce, add mozzarella and basil.' },
    { position: 5, title: 'Bake', paragraph: 'Bake at 250°C for 10-12 minutes until crust is golden.', note: 'Use a pizza stone if available' },
  ];

  for (const step of pizzaSteps) {
    const segment = await prisma.segment.create({ data: { title: step.title, paragraph: step.paragraph, note: step.note } });
    await prisma.content_segment.create({
      data: {
        content_id: pizzaContent.content_id,
        segment_id: segment.segment_id,
        position: step.position,
      },
    });
  }

  console.log('✅ Created Pizza Margherita');

  // Create Crème Brûlée
  const creme = await prisma.publication.create({
    data: {
      title: 'Crème Brûlée',
      description: ['Classic French custard dessert with caramelized sugar topping'],
      note: ['Use a kitchen torch for best caramelization'],
      public: true,
      published: true,
    },
  });

  await prisma.publication_tag.createMany({
    data: [
      { publication_id: creme.publication_id, tag_id: tags.french.tag_id },
      { publication_id: creme.publication_id, tag_id: tags.dessert.tag_id },
    ],
  });

  const cremeContent = await prisma.content.create({
    data: {
      publication_id: creme.publication_id,
      subtitle: 'Classic Recipe',
      total_prep_time: 240,
      prep_time_note: '20 min active, 220 min baking and chilling',
      serving_yield: 6,
      serving_value: 'ramekins',
      gallery: [],
    },
  });

  // Creme ingredients
  const cream = await prisma.product.create({ data: { name: 'Heavy Cream' } });
  const eggs = await prisma.product.create({ data: { name: 'Egg Yolks' } });
  const sugar = await prisma.product.create({ data: { name: 'Sugar' } });
  const vanilla = await prisma.product.create({ data: { name: 'Vanilla Extract' } });

  const cremeIngredients = [
    { product_id: cream.product_id, quantity: 500, unit_id: units.ml.unit_id },
    { product_id: eggs.product_id, quantity: 6 },
    { product_id: sugar.product_id, quantity: 100, unit_id: units.g.unit_id, note: 'Plus extra for topping' },
    { product_id: vanilla.product_id, quantity: 1, unit_id: units.tsp.unit_id },
  ];

  for (const ing of cremeIngredients) {
    const ingredient = await prisma.ingredient.create({ data: ing });
    await prisma.content_ingredient.create({
      data: {
        content_id: cremeContent.content_id,
        ingredient_id: ingredient.ingredient_id,
      },
    });
  }

  // Creme steps
  const cremeSteps = [
    { position: 1, title: 'Heat Cream', paragraph: 'Heat cream until just simmering. Remove from heat.', note: 'Do not boil' },
    { position: 2, title: 'Mix', paragraph: 'Whisk egg yolks, sugar, and vanilla until smooth.' },
    { position: 3, title: 'Temper', paragraph: 'Slowly pour hot cream into egg mixture while whisking constantly.', note: 'Prevents curdling' },
    { position: 4, title: 'Bake', paragraph: 'Pour into ramekins. Bake in water bath at 160°C for 40-45 minutes.' },
    { position: 5, title: 'Chill', paragraph: 'Refrigerate for at least 3 hours.' },
    { position: 6, title: 'Caramelize', paragraph: 'Sprinkle sugar on top. Use torch to caramelize until golden.' },
  ];

  for (const step of cremeSteps) {
    const segment = await prisma.segment.create({ data: { title: step.title, paragraph: step.paragraph, note: step.note } });
    await prisma.content_segment.create({
      data: {
        content_id: cremeContent.content_id,
        segment_id: segment.segment_id,
        position: step.position,
      },
    });
  }

  console.log('✅ Created Crème Brûlée');
  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
