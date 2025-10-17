import { v4 as uuidv4 } from "uuid";
import type { PrismaClient } from "@prisma/client";
import { assert, safeId } from "./utils.js";
import { AtomProcessor } from "./atom.processor.js";
import { ContentProcessor } from "./content.processor.js";
import winkler from "jaro-winkler";

export class PublicationProcessor {
  private atomProcessor: AtomProcessor;
  private contentProcessor: ContentProcessor;

  constructor(private tx: PrismaClient) {
    this.atomProcessor = new AtomProcessor(this.tx);
    this.contentProcessor = new ContentProcessor(this.tx);
  }

  async create(pub: any) {
    const ctx = "createPublication";
    assert(pub?.title, "Publication.title is required", ctx, "title", pub);

    const publication_id = await safeId(this.tx, "publication", "publication_id", pub.publication_id);
    const type_id = await this.atomProcessor.processCategory(pub.type, "Type", `${ctx}.type`);
    const style_id = await this.atomProcessor.processCategory(pub.style, "Style", `${ctx}.style`);
    const author_id = await this.atomProcessor.processCategory(pub.author, "Author", `${ctx}.author`);

    const created = await this.tx.publication.create({
      data: {
        publication_id,
        title: pub.title,
        description: Array.isArray(pub.description) ? pub.description : [],
        note: Array.isArray(pub.note) ? pub.note : [],
        public: typeof pub.public === "boolean" ? pub.public : true,
        published: typeof pub.published === "boolean" ? pub.published : true,
        thumbnail: pub.thumbnail ?? null,
        type_id,
        style_id,
        author_id,
      },
    });

    await this.processRelations(created.publication_id, pub);
    return created;
  }

  async update(pub: any) {
    const ctx = "updatePublication";
    assert(pub?.publication_id, "Missing publication_id for update", ctx, "publication_id", pub);

    await this.tx.publication_tag.deleteMany({ where: { publication_id: pub.publication_id } });
    
    const contentsToDelete = await this.tx.content.findMany({
        where: { publication_id: pub.publication_id },
        select: { content_id: true }
    });
    const contentIds = contentsToDelete.map(c => c.content_id);

    if (contentIds.length > 0) {
        await this.tx.content_ingredient.deleteMany({ where: { content_id: { in: contentIds } } });
        await this.tx.content_segment.deleteMany({ where: { content_id: { in: contentIds } } });
        await this.tx.content_prep_time.deleteMany({ where: { content_id: { in: contentIds } } });
        await this.tx.content.deleteMany({ where: { publication_id: pub.publication_id } });
    }
    
    await this.processRelations(pub.publication_id, pub, true);

    const type_id = await this.atomProcessor.processCategory(pub.type, "Type", `${ctx}.type`);
    const style_id = await this.atomProcessor.processCategory(pub.style, "Style", `${ctx}.style`);
    const author_id = await this.atomProcessor.processCategory(pub.author, "Author", `${ctx}.author`);

    return this.tx.publication.update({
      where: { publication_id: pub.publication_id },
      data: {
        title: pub.title,
        description: Array.isArray(pub.description) ? pub.description : [],
        note: Array.isArray(pub.note) ? pub.note : [],
        public: typeof pub.public === "boolean" ? pub.public : true,
        published: typeof pub.published === "boolean" ? pub.published : true,
        thumbnail: pub.thumbnail ?? null,
        type_id,
        style_id,
        author_id,
      },
    });
  }
  
  private async processRelations(publication_id: string, pub: any, isUpdate: boolean = false) {
  const contents = pub.contents || [];
  const subRecipeContents = contents.filter((c: any) => c.is_ingredient === true);
  const mainContents = contents.filter((c: any) => !c.is_ingredient);

  console.log(`[PublicationProcessor] Processing publication '${pub.title}' (${publication_id})`);
  console.log(`[PublicationProcessor] Found ${subRecipeContents.length} sub-recipes, ${mainContents.length} main contents`);

  const subRecipePublications: Array<{ title: string; id: string }> = [];

  // Création des sous-recettes
  for (const [index, recipeContent] of subRecipeContents.entries()) {
    assert(recipeContent.subtitle, "Content with is_ingredient=true must have a subtitle", "processRelations");
    
    const subRecipeId = uuidv4();
    const subRecipeTitle = recipeContent.subtitle;
    
    console.log(`[PublicationProcessor] Creating sub-recipe ${index + 1}/${subRecipeContents.length}: '${subRecipeTitle}' (${subRecipeId})`);

    const subPublicationPayload = {
      publication_id: subRecipeId,
      title: subRecipeTitle,
      public: pub.public,
      published: pub.published,
      author: pub.author,
      type: { str_value: 'Recette', type: 'Type' },
      contents: [{ ...recipeContent, is_ingredient: false }]
    };

    await new PublicationProcessor(this.tx).create(subPublicationPayload);
    subRecipePublications.push({ title: subRecipeTitle, id: subRecipeId });
  }

  console.log(`[PublicationProcessor] Created ${subRecipePublications.length} sub-recipe publications`);

  // Matching logique
  const THRESHOLD = 0.85;
  const matches: Array<{ subRecipe: string; product: string | null; score: number; forced: boolean }> = [];

  for (const subRecipe of subRecipePublications) {
    let bestMatch: { ingredient: any; score: number } | null = null;

    for (const content of mainContents) {
      if (Array.isArray(content.content_ingredients)) {
        for (const ingredient of content.content_ingredients) {
          const productName = ingredient.product?.name;
          if (!productName) continue;

          const score = winkler(
            productName.toLowerCase().trim(),
            subRecipe.title.toLowerCase().trim()
          );

          console.log(`[PublicationProcessor] Score '${productName}' vs '${subRecipe.title}' = ${score.toFixed(3)}`);

          if (!bestMatch || score > bestMatch.score) {
            bestMatch = { ingredient, score };
          }
        }
      }
    }

    if (bestMatch) {
      if (!bestMatch.ingredient.product) bestMatch.ingredient.product = {};
      bestMatch.ingredient.product.is_recipe_id = subRecipe.id;

      const forced = bestMatch.score < THRESHOLD;
      matches.push({
        subRecipe: subRecipe.title,
        product: bestMatch.ingredient.product?.name ?? null,
        score: bestMatch.score,
        forced
      });

      if (forced) {
        console.log(`[PublicationProcessor] Sub-recipe '${subRecipe.title}' forced match with product '${bestMatch.ingredient.product?.name}' (score: ${bestMatch.score.toFixed(3)}, below threshold)`);
      } else {
        console.log(`[PublicationProcessor] Sub-recipe '${subRecipe.title}' matched with product '${bestMatch.ingredient.product?.name}' (score: ${bestMatch.score.toFixed(3)}, above threshold)`);
      }
    } else {
      matches.push({ subRecipe: subRecipe.title, product: null, score: 0, forced: true });
      console.log(`[PublicationProcessor] Sub-recipe '${subRecipe.title}' has no product candidates, forced unmatched`);
    }
  }

  console.log(`[PublicationProcessor] Completed matching. Results:`, matches);

  // Tags
  if (Array.isArray(pub.tags)) {
    for (const [i, tag] of pub.tags.entries()) {
      const tagId = await this.atomProcessor.processCategory(tag, "Tag", `tags[${i}]`);
      if (tagId) {
        await this.tx.publication_tag.create({ data: { publication_id, category_id: tagId } });
      }
    }
  }

  // Main contents processing
  for (const [i, content] of mainContents.entries()) {
    await this.contentProcessor.process(content, publication_id, `contents[${i}]`);
  }

  console.log(`[PublicationProcessor] Completed processing for publication '${pub.title}'`);
}

}