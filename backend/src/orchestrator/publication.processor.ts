import { v4 as uuidv4 } from "uuid";
import type { PrismaClient } from "@prisma/client";
import { assert, safeId } from "./utils.js";
import { AtomProcessor } from "./atom.processor.js";
import { ContentProcessor } from "./content.processor.js";

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

    // For a full update, relationships are cleared and recreated.
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
    const recipeDefinitionContents = contents.filter((c: any) => c.is_ingredient === true);
    const mainContents = contents.filter((c: any) => !c.is_ingredient);
  
    // 1. Pre-generate UUIDs for all sub-recipes
    const subRecipeIdMap = new Map<string, string>();
    for (const recipeContent of recipeDefinitionContents) {
        assert(recipeContent.subtitle, "Content with is_ingredient=true must have a subtitle", "processRelations");
        subRecipeIdMap.set(recipeContent.subtitle, uuidv4());
    }

    // 2. Inject these pre-generated IDs into the main payload's products before any processing
    for (const content of pub.contents) {
        if (Array.isArray(content.content_ingredients)) {
            for (const ingredient of content.content_ingredients) {
                const productName = ingredient.product?.name;
                if (productName && subRecipeIdMap.has(productName)) {
                    // This is the crucial step: linking before insertion
                    ingredient.product.is_recipe_id = subRecipeIdMap.get(productName);
                }
            }
        }
    }

    // 3. Process sub-recipes using their pre-generated IDs
    for (const recipeContent of recipeDefinitionContents) {
      const subRecipeTitle = recipeContent.subtitle!;
      const subRecipeId = subRecipeIdMap.get(subRecipeTitle);

      const subPublicationPayload = {
        publication_id: subRecipeId, // Use the pre-generated ID
        title: subRecipeTitle,
        public: pub.public,
        published: pub.published,
        author: pub.author,
        type: { str_value: 'Recette', type: 'Type' },
        contents: [{ ...recipeContent, is_ingredient: false }]
      };
      
      // Create the sub-publication. It will now have the predictable ID.
      await new PublicationProcessor(this.tx).create(subPublicationPayload);
    }

    // 4. Process main tags
    if (Array.isArray(pub.tags)) {
      for (const [i, tag] of pub.tags.entries()) {
        const tagId = await this.atomProcessor.processCategory(tag, "Tag", `tags[${i}]`);
        if (tagId) {
          await this.tx.publication_tag.create({ data: { publication_id, category_id: tagId } });
        }
      }
    }
  
    // 5. Process only the main contents for the current publication
    for (const [i, content] of mainContents.entries()) {
        await this.contentProcessor.process(content, publication_id, `contents[${i}]`);
    }
  }
}

