import { AppUserData, CategoryData, PublicationData } from "./db.types"

export type UserUpsert = Required<Omit<AppUserData, "created" | "user_id" | "updated">>
export type UserRead = Required<Omit<AppUserData, "created" | "user_id" | "updated" | "password">>

export type Category = CategoryCore & CategoryRelations
export type CategoryCore = Required<Pick<CategoryData, "str_value" | "type">>
export type CategoryRelations =  Partial<Omit<CategoryData, "str_value" | "type" | "category_id">>;

export type CategoryUpsertDto = Partial<CategoryCore & CategoryRelations> & {
  connect?: {
    publications_type?: { publication_id: string }[];
    publications_style?: { publication_id: string }[];
    publications_author?: { publication_id: string }[];
    prep_time?: { prep_time_id: string }[];
    publication_tags?: { category_id: string; publication_id: string }[];
    product_categories?: { category_id: string; product_id: string }[];
  };
  // Not used by create
  set?: {
    publications_type?: { publication_id: string }[];
    publications_style?: { publication_id: string }[];
    publications_author?: { publication_id: string }[];
    prep_time?: { prep_time_id: string }[];
    publication_tags?: { category_id: string; publication_id: string }[];
    product_categories?: { category_id: string; product_id: string }[];
  };
};

export type PublicationUpsert = Required<Omit<PublicationData, "publication_id">>