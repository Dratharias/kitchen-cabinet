export interface PublicationType {
  strValue: string;
}

export interface PublicationStyle {
  strValue: string;
}

export interface Author {
  strValue: string;
}

export interface Publication {
  publicationId: string;
  title: string;
  description?: string[];
  note?: string[];
  thumbnail?: string;
  type?: PublicationType;
  style?: PublicationStyle;
  author?: Author;
}

export interface Paginated<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
