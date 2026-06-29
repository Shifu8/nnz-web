import { notFound } from "next/navigation";
import { Metadata } from "next";
import NfcVerifyClient from "./NfcVerifyClient";

const products = {
  "obsession-hoodie": {
    name: "Obsession Hoodie",
    type: "Hoodie Oversize",
    collection: "Nothing Is Real",
    price: 25,
    image: "/images/kristina_merch.png",
    material: "Fleece premium 420gsm",
    color: "Rose Dust",
    nfcId: "obsession-hoodie",
  },
  "obsession-jogger": {
    name: "Obsession Jogger",
    type: "Jogger",
    collection: "Nothing Is Real",
    price: 20,
    image: "/images/kristina_merch.png",
    material: "Fleece premium 380gsm",
    color: "Rose Dust",
    nfcId: "obsession-jogger",
  },
  "obsession-set": {
    name: "Obsession Complete Set",
    type: "Conjunto Completo",
    collection: "Nothing Is Real",
    price: 45,
    image: "/images/kristina_merch.png",
    material: "Fleece premium 420gsm / 380gsm",
    color: "Rose Dust",
    nfcId: "obsession-set",
  },
};

export function generateStaticParams() {
  return Object.keys(products).map((id) => ({ id }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const product = products[params.id as keyof typeof products];
  if (!product) return { title: "Producto no encontrado" };
  return {
    title: `${product.name} · NENEZ Authentic`,
    description: `Verificación NFC · ${product.name} de la colección ${product.collection}`,
  };
}

export default function VerifyPage({ params }: { params: { id: string } }) {
  const product = products[params.id as keyof typeof products];
  if (!product) notFound();
  return <NfcVerifyClient product={product} />;
}
