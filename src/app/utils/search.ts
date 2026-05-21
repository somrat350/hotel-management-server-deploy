import { Prisma } from "@prisma/client";

export const buildSearchCondition = (
  searchTerm: string,
  searchableFields: string[],
) => {
  if (!searchTerm) return {};

  return {
    OR: searchableFields.map((field) => ({
      [field]: {
        contains: searchTerm,
        mode: Prisma.QueryMode.insensitive,
      },
    })),
  };
};
