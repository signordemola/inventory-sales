import { Warehouse } from "lucide-react";
import Link from "next/link";

const Logo = () => {
  return (
    <Link href={`/`} className="flex items-center gap-2.5">
      <span className="bg-primary/10 rounded-xl size-10 flex items-center justify-center">
        <Warehouse className="text-2xl text-primary" />
      </span>

      <span className="text-2xl font-bold tracking-tight text-slate-900">
        NaijaStock
      </span>
    </Link>
  );
};

export default Logo;
