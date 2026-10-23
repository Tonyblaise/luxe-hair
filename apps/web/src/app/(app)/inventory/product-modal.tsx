"use client";

import { useSearchParams } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { Button, Field, FormError, Modal, Segmented, useActionFeedback, useCloseModal, useToast } from "@/components/ui";
import { deleteProduct, saveProduct } from "./actions";

export type ProductView = {
  id: string;
  name: string;
  brand: string | null;
  type: "retail" | "backbar";
  unitCost: number | null;
  price: number | null;
  onHand: number;
  reorderAt: number;
};

/** Add Product (?modal=add-product) and Edit Product (?modal=edit-product&product=<id>). */
export function ProductModals({ products }: { products: ProductView[] }) {
  return (
    <>
      <Modal id="add-product" title="Add Product">
        <ProductForm />
      </Modal>
      <Modal id="edit-product" title="Edit Product" clearParams={["product"]}>
        <EditProduct products={products} />
      </Modal>
    </>
  );
}

function EditProduct({ products }: { products: ProductView[] }) {
  const id = useSearchParams().get("product");
  const product = products.find((p) => p.id === id);
  if (!product) return <p className="text-sm text-gray-600">This product no longer exists.</p>;
  return <ProductForm key={product.id} product={product} />;
}

function ProductForm({ product }: { product?: ProductView }) {
  const close = useCloseModal(["product"]);
  const toast = useToast();
  const [state, action, pending] = useActionState(saveProduct.bind(null, product?.id ?? null), undefined);
  useActionFeedback(state, close);
  const [type, setType] = useState<ProductView["type"]>(product?.type ?? "retail");
  const [deleting, startDelete] = useTransition();

  const remove = () => {
    if (!product || !confirm(`Delete ${product.name}? This can't be undone.`)) return;
    startDelete(async () => {
      const result = await deleteProduct(product.id, product.name);
      if (result?.toast) toast(result.toast);
      if (result?.ok) close();
      else if (result?.error) toast(result.error);
    });
  };

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormError message={state?.error} />
      <Field label="Product name" name="name" required placeholder="e.g. Hydrating Shampoo 300ml" defaultValue={product?.name} />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Brand" name="brand" placeholder="e.g. Aveline" defaultValue={product?.brand ?? ""} />
        <Segmented
          name="type"
          label="Type"
          value={type}
          onChange={setType}
          options={[
            { value: "retail", label: "Retail" },
            { value: "backbar", label: "Backbar" },
          ]}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Cost (KES)"
          name="unitCost"
          type="number"
          inputMode="numeric"
          min={0}
          defaultValue={product?.unitCost ?? ""}
        />
        {type === "retail" ? (
          <Field
            label="Sell price (KES)"
            name="price"
            type="number"
            inputMode="numeric"
            min={0}
            defaultValue={product?.price ?? ""}
          />
        ) : (
          <Field label="Sell price (KES)" value="Not sold" disabled hint="Backbar stock is used in services." />
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="On hand"
          name="quantityInStock"
          type="number"
          inputMode="numeric"
          min={0}
          required
          defaultValue={product?.onHand ?? 0}
        />
        <Field
          label="Reorder at"
          name="reorderPoint"
          type="number"
          inputMode="numeric"
          min={0}
          required
          defaultValue={product?.reorderAt ?? 0}
          hint="Shows as Low Stock at or below this."
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        {product ? (
          <Button variant="ghost" size="lg" disabled={deleting} onClick={remove} className="text-[#b03a2e]! hover:bg-[#fdecea]!">
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : product ? "Save Product" : "Add Product"}
        </Button>
      </div>
    </form>
  );
}
