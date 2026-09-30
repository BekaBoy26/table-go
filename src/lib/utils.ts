export { cn } from "cn"

const kgs = (n: number) => n.toLocaleString("en-US")

export const formatPrice = (min: number | null, max: number | null) => {
  if (min != null && max != null) return `${kgs(min)}–${kgs(max)} KGS`
  if (min != null) return `from ${kgs(min)} KGS`
  if (max != null) return `up to ${kgs(max)} KGS`
  return "Price not specified"
}
