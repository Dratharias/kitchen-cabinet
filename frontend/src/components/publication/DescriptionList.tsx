import { For } from "solid-js";
import { Button } from "../ui/atoms/Button";
import { PlusIcon } from "../ui/atoms/Icons";
import { Span } from "../ui/atoms/Span";
import { DescriptionCard } from "./DescriptionCard";
import {
  FormDescription,
  FormNote,
  createDescriptionFormActions,
} from "./DescriptionLogicHandler";

type DescriptionListProps = {
  descriptions: FormDescription[];
  notes: FormNote[];
  setForm: (...args: any[]) => void;
};

export function DescriptionList(props: DescriptionListProps) {
  const actions = () =>
    createDescriptionFormActions(
      props.descriptions,
      props.notes,
      props.setForm,
    );

  return (
    <div class="space-y-6 rounded-xl mt-8">
      <div>
        <div class="flex items-center justify-between mb-6">
          <Span class="text-xl font-semibold">Descriptions</Span>
          <Span class="text-sm">
            {props.descriptions.length} paragraphe
            {props.descriptions.length !== 1 ? "s" : ""}
          </Span>
        </div>

        <div class="space-y-4">
          <For each={props.descriptions}>
            {(desc, i) => (
              <DescriptionCard
                index={i()}
                item={desc}
                label="Paragraphe"
                placeholder="Texte de description"
                actions={actions()}
                type="description"
              />
            )}
          </For>

          <div class="flex w-full justify-center items-center">
            <div class="w-fit">
              {props.descriptions.length === 0 ? (
                <Button
                  icon={<PlusIcon class="w-4 h-4" />}
                  variant={
                    props.descriptions.length === 0 ? "primary" : "secondary"
                  }
                  onClick={actions().addDescription}
                >
                  Ajouter une description
                </Button>
              ) : (
                <Button
                  icon={<PlusIcon class="w-4 h-4" />}
                  variant={
                    props.descriptions.length === 0 ? "primary" : "secondary"
                  }
                  onClick={actions().addDescription}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div class="flex items-center justify-between mb-6">
          <Span class="text-xl font-semibold">Notes</Span>
          <Span class="text-sm">
            {props.notes.length} note
            {props.notes.length !== 1 ? "s" : ""}
          </Span>
        </div>

        <div class="space-y-4">
          <For each={props.notes}>
            {(note, i) => (
              <DescriptionCard
                index={i()}
                item={note}
                label="Note"
                placeholder="Texte de note interne"
                actions={actions()}
                type="note"
              />
            )}
          </For>

          <div class="flex w-full justify-center items-center">
            <div class="w-fit">
              {props.notes.length === 0 ? (
                <Button
                  icon={<PlusIcon class="w-4 h-4" />}
                  variant={props.notes.length === 0 ? "primary" : "secondary"}
                  onClick={actions().addNote}
                  class="flex items-center gap-2"
                >
                  Ajouter une note
                </Button>
              ) : (
                <Button
                  icon={<PlusIcon class="w-4 h-4" />}
                  variant={
                    props.notes.length === 0 ? "primary" : "secondary"
                  }
                  onClick={actions().addNote}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
