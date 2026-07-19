// components/content/MenuContent.tsx
import { memo } from "react";
import { UtensilsCrossed } from "lucide-react";

type MenuItem = { id: string; name: string; price: string };
type Category = { id: string; name: string; items: MenuItem[] };

function MenuContentBase({ data }: { data: Record<string, any> }) {
  const restaurantName = data.restaurantName || "Restaurant Name";
  const currency = data.currency || "₹";
  const categories: Category[] = data.categories || [];

  return (
    <div className="flex flex-col">
      <div className="flex flex-col items-center gap-2 px-5 py-6 text-center text-white sm:px-8" style={{ backgroundColor: "var(--accent)" }}>
        <UtensilsCrossed className="h-6 w-6" />
        <h2 className="text-lg font-bold">{restaurantName}</h2>
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/70">Menu</p>
      </div>

      <div className="space-y-5 px-5 py-5 sm:px-8">
        {categories.map((cat) => (
          <div key={cat.id}>
            <p className="mb-2 text-[12px] font-bold uppercase tracking-wide" style={{ color: "var(--accent)" }}>{cat.name}</p>
            <div className="space-y-1.5">
              {cat.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b border-neutral-100 py-1.5">
                  <span className="text-[13px] text-neutral-800">{item.name || "Item"}</span>
                  <span className="text-[13px] font-semibold text-neutral-600">{currency}{item.price || "0"}</span>
                </div>
              ))}
              {cat.items.length === 0 && <p className="py-1 text-xs text-neutral-400">No items in this category.</p>}
            </div>
          </div>
        ))}
        {categories.length === 0 && <p className="py-6 text-center text-xs text-neutral-400">No menu items added yet.</p>}
      </div>
    </div>
  );
}

export default memo(MenuContentBase);
