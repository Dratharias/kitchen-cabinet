import { SetStoreFunction } from "solid-js/store";
import { MacroPayload } from "@/types";

// --- Types ---
export type FormIngredient = {
  quantity: number;
  multiply_factor: number;
  product_id: string;
  product_name: string;
  product_en_name: string;
  unit: string;
  isNewProduct: boolean;
  isNewUnit: boolean;
  publication_id: string;
  macro: MacroPayload;
};

export type IngredientFormActions = {
  updateQuantity: (index: number, value: number) => void;
  updateMultiplyFactor: (index: number, value: number) => void;
  updateUnit: (index: number, unitId: string) => void;
  updateIsNewUnit: (index: number, isNew: boolean) => void;
  selectProduct: (index: number, productId: string) => void;
  createNewProduct: (index: number) => void;
  updateProductName: (index: number, name: string) => void;
  updateProductEnName: (index: number, name: string) => void;
  updatePublicationId: (index: number, pubId: string) => void;
  updateMacroField: (
    index: number,
    field: keyof MacroPayload,
    value: number,
  ) => void;
  addIngredient: () => void;
  removeIngredient: (index: number) => void;
};

// --- Actions factory ---
export const createIngredientFormActions = (
  contentIndex: number,
  _ingredients: FormIngredient[],
  setForm: SetStoreFunction<any>,
): IngredientFormActions => ({
  updateQuantity: (i, v) =>
    setForm("contents", contentIndex, "ingredients", i, "quantity", v),

  updateMultiplyFactor: (i, v) =>
    setForm("contents", contentIndex, "ingredients", i, "multiply_factor", v),

  updateUnit: (i, unitId) =>
    setForm("contents", contentIndex, "ingredients", i, "unit", unitId),

  updateIsNewUnit: (i, isNew) =>
    setForm("contents", contentIndex, "ingredients", i, "isNewUnit", isNew),

  selectProduct: (i, productId) =>
    setForm("contents", contentIndex, "ingredients", i, {
      product_id: productId,
      isNewProduct: false,
    }),

  createNewProduct: (i) =>
    setForm("contents", contentIndex, "ingredients", i, {
      isNewProduct: true,
      product_id: "",
      product_name: "",
    }),

  updateProductName: (i, name) =>
    setForm("contents", contentIndex, "ingredients", i, "product_name", name),

  updateProductEnName: (i, name) =>
    setForm(
      "contents",
      contentIndex,
      "ingredients",
      i,
      "product_en_name",
      name,
    ),

  updatePublicationId: (i, pubId) =>
    setForm(
      "contents",
      contentIndex,
      "ingredients",
      i,
      "publication_id",
      pubId,
    ),

  updateMacroField: (i, field, value) =>
    setForm("contents", contentIndex, "ingredients", i, "macro", field, value),

  addIngredient: () =>
    setForm(
      "contents",
      contentIndex,
      "ingredients",
      (prev: FormIngredient[]) => [
        ...prev,
        {
          quantity: 0,
          multiply_factor: 1,
          product_id: "",
          product_name: "",
          product_en_name: "",
          unit: "",
          isNewProduct: false,
          isNewUnit: false,
          publication_id: "",
          macro: {
            calories: 0,
            protein: 0,
            fiber: 0,
            sugar: 0,
            saturated: 0,
            trans: 0,
            caffein: 0,
          },
        } satisfies FormIngredient,
      ],
    ),

  removeIngredient: (i) =>
    setForm("contents", contentIndex, "ingredients", (arr: FormIngredient[]) =>
      arr.filter((_, idx) => idx !== i),
    ),
});
