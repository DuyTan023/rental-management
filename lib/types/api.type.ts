export type FindManyParams = {
  page?: number;
  limit?: number;
  keyword?: string;
};
export type PaginationResult<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPage: number;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};
