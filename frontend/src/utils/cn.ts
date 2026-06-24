import { clsx } from "clsx";

export const cn = (...values: Array<string | boolean | undefined | null>) =>
  clsx(values);
