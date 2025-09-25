import { MacroPayload } from "@/types";
import { SetStoreFunction } from "solid-js/store";

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
  updateQuantity: (index: number, quantity: number) => void;
  updateMultiplyFactor: (index: number, factor: number) => void;
  updateUnit: (index: number, unit: string) => void;
  selectProduct: (index: number, productId: string) => void;
  createNewProduct: (index: number) => void;
  updateIsNewUnit: (index: number, isNew: boolean) => void;
  updateProductName: (index: number, name: string) => void;
  updateProductEnName: (index: number, enName: string) => void;
  updatePublicationId: (index: number, publicationId: string) => void;
  updateMacroField: (
    index: number,
    field: keyof MacroPayload,
    value: number,
  ) => void;
  addIngredient: () => void;
  removeIngredient: (index: number) => void;
};

export const createIngredientFormActions = (
  contentIndex: number,
  ingredients: FormIngredient[],
  setForm: SetStoreFunction<any>,
): IngredientFormActions => ({
  updateQuantity: (index, quantity) =>
    setForm(
      "contents",
      contentIndex,
      "ingredients",
      index,
      "quantity",
      quantity,
    ),

  updateMultiplyFactor: (index, factor) =>
    setForm(
      "contents",
      contentIndex,
      "ingredients",
      index,
      "multiply_factor",
      factor,
    ),

  updateUnit: (index, unit) =>
    setForm("contents", contentIndex, "ingredients", index, "unit", unit),

  updateIsNewUnit: (index, isNew) =>
    setForm("contents", contentIndex, "ingredients", index, "isNewUnit", isNew),

  selectProduct: (index, productId) =>
    setForm("contents", contentIndex, "ingredients", index, {
      product_id: productId,
      isNewProduct: false,
    }),

  createNewProduct: (index) =>
    setForm("contents", contentIndex, "ingredients", index, {
      isNewProduct: true,
      product_id: "",
      product_name: "",
    }),

  updateProductName: (index, name) =>
    setForm(
      "contents",
      contentIndex,
      "ingredients",
      index,
      "product_name",
      name,
    ),

  updateProductEnName: (index, enName) =>
    setForm(
      "contents",
      contentIndex,
      "ingredients",
      index,
      "product_en_name",
      enName,
    ),

  updatePublicationId: (index, publicationId) =>
    setForm(
      "contents",
      contentIndex,
      "ingredients",
      index,
      "publication_id",
      publicationId,
    ),

  updateMacroField: (index, field, value) =>
    setForm(
      "contents",
      contentIndex,
      "ingredients",
      index,
      "macro",
      field,
      value,
    ),

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
          isNewUnit: false,
          isNewProduct: false,
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

  removeIngredient: (index: number) => {
    setForm(
      "contents",
      contentIndex,
      "ingredients",
      (ingredients: FormIngredient[]) =>
        ingredients.filter((_, i) => i !== index),
    );
  },
});
