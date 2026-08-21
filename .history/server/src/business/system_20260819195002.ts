import { Order } from "@/business/types.js";
import { seedProducts } from "@/business/seed.js";

const products = seedProducts();
const orders: Order[] = []
let nextOrderId = 1