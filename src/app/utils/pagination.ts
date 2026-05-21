import { IPaginationOptions } from "../types";

export const calculatePagination = (options: IPaginationOptions) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = page > 0 ? (page - 1) * limit : 0;

  //   Only allow sorting by specific fields to prevent SQL injection
  const allowedSortFields = ["name", "createdAt"];

  const sortBy = allowedSortFields.includes(options.sortBy || "")
    ? options.sortBy
    : "createdAt";

  const sortOrder = options.sortOrder || "desc";

  return {
    page,
    limit,
    skip,
    sortBy: sortBy as string,
    sortOrder,
  };
};
