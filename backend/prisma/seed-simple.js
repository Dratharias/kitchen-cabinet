import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting simple seed...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.app_user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
    },
  });
  console.log('✅ Created admin user:', admin.username);

  // Create some basic units
  const units = await Promise.all([
    prisma.unit.upsert({
      where: { name: 'g' },
      update: {},
      create: { name: 'g' },
    }),
    prisma.unit.upsert({
      where: { name: 'ml' },
      update: {},
      create: { name: 'ml' },
    }),
    prisma.unit.upsert({
      where: { name: 'cup' },
      update: {},
      create: { name: 'cup' },
    }),
    prisma.unit.upsert({
      where: { name: 'tsp' },
      update: {},
      create: { name: 'tsp' },
    }),
    prisma.unit.upsert({
      where: { name: 'tbsp' },
      update: {},
      create: { name: 'tbsp' },
    }),
  ]);
  console.log('✅ Created units:', units.map(u => u.name).join(', '));

  // Create some tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { name: 'Cocktail' },
      update: {},
      create: { name: 'Cocktail', slug: 'cocktail', description: 'Alcoholic beverages' },
    }),
    prisma.tag.upsert({
      where: { name: 'Dessert' },
      update: {},
      create: { name: 'Dessert', slug: 'dessert', description: 'Sweet treats' },
    }),
    prisma.tag.upsert({
      where: { name: 'Quick' },
      update: {},
      create: { name: 'Quick', slug: 'quick', description: 'Recipes under 30 minutes' },
    }),
  ]);
  console.log('✅ Created tags:', tags.map(t => t.name).join(', '));

  // Create some products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { name: 'White Rum' },
      update: {},
      create: { name: 'White Rum', description: 'Light rum for cocktails' },
    }),
    prisma.product.upsert({
      where: { name: 'Lime' },
      update: {},
      create: { name: 'Lime', description: 'Fresh citrus fruit' },
    }),
    prisma.product.upsert({
      where: { name: 'Mint' },
      update: {},
      create: { name: 'Mint', description: 'Fresh mint leaves' },
    }),
    prisma.product.upsert({
      where: { name: 'Sugar' },
      update: {},
      create: { name: 'Sugar', description: 'White granulated sugar' },
    }),
    prisma.product.upsert({
      where: { name: 'Soda Water' },
      update: {},
      create: { name: 'Soda Water', description: 'Sparkling water' },
    }),
  ]);
  console.log('✅ Created products:', products.map(p => p.name).join(', '));

  // Create a sample publication with content
  const mojito = await prisma.publication.create({
    data: {
      title: 'Classic Mojito',
      description: ['A refreshing Cuban cocktail with mint and lime.'],
      note: ['Best served ice cold', 'Use fresh mint for best flavor'],
      public: true,
      published: true,
      thumbnail: null,
      contents: {
        create: {
          subtitle: 'Main Recipe',
          total_prep_time: 5,
          prep_time_note: '5 minutes prep',
          serving_yield: 1,
          serving_value: 'cocktail',
          note: 'Muddle gently to avoid bitterness',
          gallery: [],
        },
      },
    },
  });
  console.log('✅ Created publication:', mojito.title);

  // Get the content we just created
  const content = await prisma.content.findFirst({
    where: { publication_id: mojito.publication_id },
  });

  if (!content) {
    throw new Error('Content not found');
  }

  // Create segments for the mojito
  const segments = await Promise.all([
    prisma.segment.create({
      data: {
        title: 'Muddle',
        paragraph: 'In a glass, muddle the mint leaves with sugar and lime juice.',
        note: 'Be gentle to avoid releasing bitter oils from mint',
      },
    }),
    prisma.segment.create({
      data: {
        title: 'Mix',
        paragraph: 'Add rum and fill glass with ice.',
      },
    }),
    prisma.segment.create({
      data: {
        title: 'Top',
        paragraph: 'Top with soda water and stir gently.',
        note: 'Garnish with mint sprig and lime wheel',
      },
    }),
  ]);
  console.log('✅ Created segments:', segments.length);

  // Link segments to content
  await Promise.all(
    segments.map((seg, idx) =>
      prisma.content_segment.create({
        data: {
          content_id: content.content_id,
          segment_id: seg.segment_id,
          position: idx + 1,
        },
      })
    )
  );
  console.log('✅ Linked segments to content');

  // Create ingredients
  const ingredientsData = [
    { product: products.find(p => p.name === 'White Rum'), quantity: 60, unit: units.find(u => u.name === 'ml') },
    { product: products.find(p => p.name === 'Lime'), quantity: 1, unit: null, note: 'juiced' },
    { product: products.find(p => p.name === 'Mint'), quantity: 10, unit: null, note: 'fresh leaves' },
    { product: products.find(p => p.name === 'Sugar'), quantity: 2, unit: units.find(u => u.name === 'tsp') },
    { product: products.find(p => p.name === 'Soda Water'), quantity: 100, unit: units.find(u => u.name === 'ml') },
  ];

  for (const ingData of ingredientsData) {
    const ingredient = await prisma.ingredient.create({
      data: {
        product_id: ingData.product.product_id,
        quantity: ingData.quantity,
        unit_id: ingData.unit?.unit_id || null,
        note: ingData.note || null,
      },
    });

    await prisma.content_ingredient.create({
      data: {
        content_id: content.content_id,
        ingredient_id: ingredient.ingredient_id,
      },
    });
  }
  console.log('✅ Created and linked ingredients');

  // Link tags to publication
  await prisma.publication_tag.create({
    data: {
      publication_id: mojito.publication_id,
      tag_id: tags.find(t => t.name === 'Cocktail').tag_id,
    },
  });
  await prisma.publication_tag.create({
    data: {
      publication_id: mojito.publication_id,
      tag_id: tags.find(t => t.name === 'Quick').tag_id,
    },
  });
  console.log('✅ Linked tags to publication');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
