import { Component } from "solid-js";
import { Span } from "../html/Span";
import { PrevPageButton, NextPageButton } from "./PaginationButtons";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

interface PaginationNavigatorProps {
  pagination: PaginationProps;
  class?: string;
}

export const PaginationNavigator: Component<PaginationNavigatorProps> = (props) => {
  const handlePrev = () => {
    if (props.pagination.page > 1) {
      props.pagination.onPageChange(props.pagination.page - 1);
    }
  };

  const handleNext = () => {
    if (props.pagination.page < props.pagination.totalPages) {
      props.pagination.onPageChange(props.pagination.page + 1);
    }
  };

  return (
    <div class={`flex justify-evenly items-center mt-6 gap-4 ${props.class ?? ""}`}>
      <PrevPageButton
        onClick={handlePrev}
        disabled={props.pagination.page <= 1}
        class="max-w-64"
      >
        Précédent
      </PrevPageButton>

      <Span class="text-sm font-medium">
        Page {props.pagination.page} / {props.pagination.totalPages}
      </Span>

      <NextPageButton
        onClick={handleNext}
        disabled={props.pagination.page >= props.pagination.totalPages}
        reverse={true}
        class="max-w-64"
      >
        Suivant
      </NextPageButton>
    </div>
  );
};
