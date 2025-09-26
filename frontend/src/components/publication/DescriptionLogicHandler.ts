export type FormDescription = {
  text: string;
  id: string;
};

export type FormNote = {
  text: string;
  id: string;
};

export function createDescriptionFormActions(
  descriptions: FormDescription[],
  notes: FormNote[],
  setForm: (...args: any[]) => void,
) {
  return {
    // Description actions
    addDescription: () => {
      const newDescription: FormDescription = {
        text: "",
        id: crypto.randomUUID(),
      };
      setForm("descriptions", [...descriptions, newDescription]);
    },

    removeDescription: (index: number) => {
      setForm("descriptions", (descriptions: FormDescription[]) =>
        descriptions.filter((_, i) => i !== index),
      );
    },

    updateDescription: (index: number, text: string) => {
      setForm("descriptions", index, "text", text);
    },

    // Note actions
    addNote: () => {
      const newNote: FormNote = {
        text: "",
        id: crypto.randomUUID(),
      };
      setForm("notes", [...notes, newNote]);
    },

    removeNote: (index: number) => {
      setForm("notes", (notes: FormNote[]) =>
        notes.filter((_, i) => i !== index),
      );
    },

    updateNote: (index: number, text: string) => {
      setForm("notes", index, "text", text);
    },
  };
}
