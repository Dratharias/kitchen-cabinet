-- CreateTable
CREATE TABLE "app_user" (
    "user_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_user_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "publication" (
    "publication_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "note" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "public" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "thumbnail" TEXT,
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publication_pkey" PRIMARY KEY ("publication_id")
);

-- CreateTable
CREATE TABLE "content" (
    "content_id" TEXT NOT NULL,
    "publication_id" TEXT NOT NULL,
    "subtitle" TEXT,
    "thumbnail" TEXT,
    "note" TEXT,
    "total_prep_time" SMALLINT NOT NULL DEFAULT 0,
    "prep_time_note" TEXT,
    "serving_yield" SMALLINT,
    "serving_value" TEXT,
    "gallery" JSONB DEFAULT '[]',

    CONSTRAINT "content_pkey" PRIMARY KEY ("content_id")
);

-- CreateTable
CREATE TABLE "segment" (
    "segment_id" TEXT NOT NULL,
    "title" TEXT,
    "paragraph" TEXT NOT NULL,
    "note" TEXT,
    "section" TEXT,

    CONSTRAINT "segment_pkey" PRIMARY KEY ("segment_id")
);

-- CreateTable
CREATE TABLE "ingredient" (
    "ingredient_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" DECIMAL(10,2),
    "unit_id" TEXT,
    "cut" TEXT,
    "title" TEXT,
    "note" TEXT,
    "multiply_factor" DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    "section" TEXT,

    CONSTRAINT "ingredient_pkey" PRIMARY KEY ("ingredient_id")
);

-- CreateTable
CREATE TABLE "product" (
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "product_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "unit" (
    "unit_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "unit_pkey" PRIMARY KEY ("unit_id")
);

-- CreateTable
CREATE TABLE "content_segment" (
    "content_id" TEXT NOT NULL,
    "segment_id" TEXT NOT NULL,
    "position" SMALLINT,

    CONSTRAINT "content_segment_pkey" PRIMARY KEY ("content_id","segment_id")
);

-- CreateTable
CREATE TABLE "content_ingredient" (
    "content_id" TEXT NOT NULL,
    "ingredient_id" TEXT NOT NULL,

    CONSTRAINT "content_ingredient_pkey" PRIMARY KEY ("content_id","ingredient_id")
);

-- CreateTable
CREATE TABLE "tag" (
    "tag_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "tag_pkey" PRIMARY KEY ("tag_id")
);

-- CreateTable
CREATE TABLE "publication_tag" (
    "publication_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "publication_tag_pkey" PRIMARY KEY ("publication_id","tag_id")
);

-- CreateTable
CREATE TABLE "review" (
    "review_id" TEXT NOT NULL,
    "publication_id" TEXT NOT NULL,
    "rating" SMALLINT,
    "comment" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "date_review" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_pkey" PRIMARY KEY ("review_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_user_username_key" ON "app_user"("username");

-- CreateIndex
CREATE INDEX "publication_published_public_idx" ON "publication"("published", "public");

-- CreateIndex
CREATE INDEX "publication_date_created_idx" ON "publication"("date_created");

-- CreateIndex
CREATE INDEX "content_publication_id_idx" ON "content"("publication_id");

-- CreateIndex
CREATE INDEX "ingredient_product_id_idx" ON "ingredient"("product_id");

-- CreateIndex
CREATE INDEX "ingredient_unit_id_idx" ON "ingredient"("unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_name_key" ON "product"("name");

-- CreateIndex
CREATE INDEX "product_name_idx" ON "product"("name");

-- CreateIndex
CREATE UNIQUE INDEX "unit_name_key" ON "unit"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tag_name_key" ON "tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tag_slug_key" ON "tag"("slug");

-- CreateIndex
CREATE INDEX "tag_name_idx" ON "tag"("name");

-- CreateIndex
CREATE INDEX "publication_tag_tag_id_idx" ON "publication_tag"("tag_id");

-- CreateIndex
CREATE INDEX "review_publication_id_idx" ON "review"("publication_id");

-- CreateIndex
CREATE INDEX "review_date_review_idx" ON "review"("date_review");

-- AddForeignKey
ALTER TABLE "content" ADD CONSTRAINT "content_publication_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "publication"("publication_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient" ADD CONSTRAINT "ingredient_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient" ADD CONSTRAINT "ingredient_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "unit"("unit_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_segment" ADD CONSTRAINT "content_segment_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content"("content_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_segment" ADD CONSTRAINT "content_segment_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "segment"("segment_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_ingredient" ADD CONSTRAINT "content_ingredient_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content"("content_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_ingredient" ADD CONSTRAINT "content_ingredient_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredient"("ingredient_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publication_tag" ADD CONSTRAINT "publication_tag_publication_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "publication"("publication_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publication_tag" ADD CONSTRAINT "publication_tag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tag"("tag_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review" ADD CONSTRAINT "review_publication_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "publication"("publication_id") ON DELETE CASCADE ON UPDATE CASCADE;
