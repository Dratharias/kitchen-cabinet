import { Component, For, Show } from "solid-js";
import Card, { CardProps } from "./Card";
import Span from "../ui/Span";
import { PrevPageButton, NextPageButton } from "../ui/PaginationButtons";
import { colorTheme } from "../../theme/colors";

export interface CardListProps {
  cards: CardProps[];
  pagination?: {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  class?: string;
}

const CardList: Component<CardListProps> = (props) => {
  return (
    <div class={`flex flex-col w-full ${props.class || ""} min-h-full`}>
      {/* Grid responsive et flexible */}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
        <For each={props.cards}>
          {(card) => <Card {...card} />}
        </For>
      </div>

      {/* Pagination */}
      <Show when={props.pagination && props.pagination.totalPages > 1}>
        <div class="flex justify-evenly items-center mt-6 gap-4">
          <PrevPageButton
            active={false}
            onClick={() => props.pagination!.onPageChange(props.pagination!.page - 1)}
            disabled={props.pagination!.page <= 1}
            class={`${colorTheme.NavbarButton} max-w-64`}
          >
            Précédent
          </PrevPageButton>

          <Span class="text-sm font-medium">
            Page {props.pagination.page} / {props.pagination.totalPages}
          </Span>

          <NextPageButton
            active={false}
            onClick={() => props.pagination!.onPageChange(props.pagination!.page + 1)}
            disabled={props.pagination!.page >= props.pagination.totalPages}
            reverse={true}
            class={`${colorTheme.NavbarButton} max-w-64`}
          >
            Suivant
          </NextPageButton>
        </div>
      </Show>
    </div>
  );
};

export default CardList;
