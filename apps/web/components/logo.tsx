import { Warehouse } from "lucide-react";

const Logo = () => {
  return (
    <div className="flex items-center gap-2.5">
      <span className="bg-primary/10 rounded-xl size-10 flex items-center justify-center">
        <Warehouse className="text-2xl text-primary" />
      </span>

      <span className="text-2xl font-bold tracking-tight text-slate-900">
        NaijaStock
      </span>
    </div>
  );
};

export default Logo;
