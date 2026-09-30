export interface FacetValue {
  label: string;
  value: string | number;
  count: number;
  selected?: boolean;
}

export interface FacetGroup {
  id: string;
  name: string;
  type: 'checkbox' | 'radio' | 'range' | 'rating';
  values: FacetValue[];
}

export interface SearchSuggestion {
  query: string;
  highlighted: string;
  category?: string;
  productCount?: number;
  type: 'product' | 'category' | 'popular';
}

export interface SearchResult<T> {
  hits: T[];
  totalHits: number;
  facets: FacetGroup[];
  processingTimeMs: number;
  query: string;
}
